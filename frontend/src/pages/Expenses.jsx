import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { formatINR, monthLabel } from "../format.js";
import AlertBanner from "../components/AlertBanner.jsx";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import { ErrorNote, Loading, PageHeader } from "../components/ui.jsx";

// Default date for the form: today if it falls in the selected month, else the 1st of it.
function defaultDate(month) {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return today.startsWith(month) ? today : `${month}-01`;
}

export default function Expenses({ month }) {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reload expenses AND alerts together so alerts are never stale after add, edit or delete.
  const load = useCallback(async () => {
    try {
      const [cats, exps, al] = await Promise.all([
        api.getCategories(),
        api.getExpenses(month),
        api.getAlerts(month),
      ]);
      setCategories(cats);
      setExpenses(exps);
      setAlerts(al);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    setLoading(true);
    setEditing(null);
    load();
  }, [load]);

  async function save(payload) {
    setError("");
    try {
      if (editing) await api.updateExpense(editing.id, payload);
      else await api.createExpense(payload);
      setEditing(null);
      await load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  async function remove(id) {
    setError("");
    try {
      await api.deleteExpense(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader title="Expenses" subtitle={`Everything you spent in ${monthLabel(month)}`} />
      <AlertBanner alerts={alerts} />
      <ErrorNote message={error} onClose={() => setError("")} />
      <div className="card">
        <h2>{editing ? "Edit expense" : "Add an expense"}</h2>
        <ExpenseForm
          key={editing ? editing.id : "new"}
          categories={categories}
          initial={editing}
          defaultDate={defaultDate(month)}
          onSubmit={save}
          onCancel={editing ? () => setEditing(null) : null}
        />
      </div>
      <div className="card">
        <div className="card-head">
          <h2>{monthLabel(month)}</h2>
          {expenses.length > 0 && <span className="muted">{expenses.length} items · {formatINR(total)}</span>}
        </div>
        {loading ? (
          <Loading text="Loading expenses..." />
        ) : (
          <ExpenseList expenses={expenses} categories={categories} onEdit={setEditing} onDelete={remove} />
        )}
      </div>
    </div>
  );
}
