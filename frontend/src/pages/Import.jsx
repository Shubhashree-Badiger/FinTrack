import { useRef, useState } from "react";
import { api } from "../api.js";
import { formatDate, formatINR } from "../format.js";
import { Icon } from "../icons.jsx";
import { ErrorNote, PageHeader } from "../components/ui.jsx";

// Import expenses from a CSV: download the template, upload a file, review, confirm.
export default function Import({ go, onChanged }) {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setFile(null);
    setText("");
    setPreview(null);
    setDone(null);
    setError("");
    if (input.current) input.current.value = "";
  }

  async function choose(f) {
    if (!f) return;
    reset();
    if (f.size > 1_500_000) {
      setError("That file is larger than 1.5 MB. Split it into smaller files.");
      return;
    }
    setFile(f);
    setBusy(true);
    try {
      const content = await f.text();
      setText(content);
      setPreview(await api.importExpenses(content, true));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const result = await api.importExpenses(text, false);
      setDone(result);
      setPreview(null);
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Import expenses" subtitle="Bring in a bank statement or a spreadsheet instead of typing each expense." />
      <ErrorNote message={error} onClose={() => setError("")} />

      {done ? (
        <div className="card success">
          <div className="empty-icon ok"><Icon name="check" size={28} /></div>
          <h2>{done.imported} expense{done.imported === 1 ? "" : "s"} imported</h2>
          <p className="muted">
            {done.duplicates > 0 && `${done.duplicates} duplicate${done.duplicates === 1 ? "" : "s"} skipped. `}
            {done.new_categories.length > 0 && `New categories created: ${done.new_categories.join(", ")}.`}
          </p>
          <div className="row-actions">
            <button onClick={() => go("expenses")}>View expenses</button>
            <button className="secondary" onClick={reset}>Import another file</button>
          </div>
        </div>
      ) : (
        <>
          <div className="import-steps">
            <section className="card">
              <span className="step-n">1</span>
              <h3>Get the template</h3>
              <p className="muted">A CSV with the columns we read: date, amount, category, description.</p>
              <a className="btn secondary" href={api.templateUrl} download>
                <Icon name="download" size={18} /> Download template
              </a>
            </section>
            <section className="card">
              <span className="step-n">2</span>
              <h3>Upload your file</h3>
              <p className="muted">Use the template, or export a CSV from your bank and upload it as it is.</p>
              <input ref={input} id="csv" type="file" accept=".csv,text/csv" hidden
                onChange={(e) => choose(e.target.files[0])} />
              <label htmlFor="csv" className="btn">
                <Icon name="upload" size={18} /> {file ? "Choose a different file" : "Choose CSV file"}
              </label>
              {file && <p className="small file-name"><Icon name="file" size={16} /> {file.name}</p>}
            </section>
          </div>

          {busy && !preview && <p className="muted">Reading your file...</p>}

          {preview && (
            <section className="card">
              <span className="step-n">3</span>
              <h3>Review before importing</h3>
              <div className="import-stats">
                <div><strong>{preview.valid}</strong><span>will be imported</span></div>
                <div><strong>{preview.duplicates}</strong><span>duplicates skipped</span></div>
                <div className={preview.errors.length ? "bad" : ""}><strong>{preview.errors.length}</strong><span>rows with problems</span></div>
              </div>

              {preview.new_categories.length > 0 && (
                <p className="small">
                  New categories will be created:{" "}
                  {preview.new_categories.map((c) => <span key={c} className="chip">{c}</span>)}
                </p>
              )}

              {preview.preview.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Date</th><th>Category</th><th>Description</th><th className="num">Amount</th></tr></thead>
                    <tbody>
                      {preview.preview.map((r, i) => (
                        <tr key={i}>
                          <td>{formatDate(r.date)}</td>
                          <td><span className="chip">{r.category}</span></td>
                          <td>{r.description || <span className="muted">-</span>}</td>
                          <td className="num strong">{formatINR(r.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.valid > preview.preview.length && (
                    <p className="muted small">Showing the first {preview.preview.length} of {preview.valid} rows.</p>
                  )}
                </div>
              )}

              {preview.errors.length > 0 && (
                <details className="problems" open>
                  <summary>{preview.errors.length} row{preview.errors.length === 1 ? "" : "s"} will be skipped</summary>
                  <ul>
                    {preview.errors.map((e) => <li key={e.row}>Line {e.row}: {e.message}</li>)}
                  </ul>
                </details>
              )}

              <div className="row-actions">
                <button onClick={confirm} disabled={busy || preview.valid === 0}>
                  {busy ? "Importing..." : `Import ${preview.valid} expense${preview.valid === 1 ? "" : "s"}`}
                </button>
                <button className="secondary" onClick={reset}>Cancel</button>
              </div>
              {preview.valid === 0 && <p className="muted small">Nothing new to import from this file.</p>}
            </section>
          )}

          <section className="card tips">
            <h3>Good to know</h3>
            <ul>
              <li>Dates can be <code>2026-11-05</code> or <code>05/11/2026</code>. Amounts can include ₹ and commas.</li>
              <li>Bank exports work as they are: columns like <code>Txn Date</code>, <code>Narration</code> and <code>Withdrawal Amt</code> are recognised. Rows without a debit amount (credits) are skipped.</li>
              <li>If the category is blank, we guess it from the description (for example Swiggy becomes Food). Unknown category names are created for you.</li>
              <li>Importing the same file twice is safe. Existing expenses are detected and skipped.</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
