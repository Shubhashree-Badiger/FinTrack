import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatINR, monthLabel } from "../format.js";
import BudgetChart from "../components/BudgetChart.jsx";
import { ErrorNote, Loading, PageHeader, StatusBadge } from "../components/ui.jsx";

export default function Reports({ month }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    Promise.all([api.getBudgetVsSpend(month), api.getMonthlyTotal(month)])
      .then(([rows, t]) => !cancelled && setData({ rows, total: t.total }))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [month]);

  if (error) return <ErrorNote message={error} />;
  if (!data) return <Loading text="Building your report..." />;
  const { rows, total } = data;

  return (
    <div>
      <PageHeader title="Reports" subtitle={`Spending against budget in ${monthLabel(month)}`} />
      <div className="card report-total">
        <span className="muted">Total spending</span>
        <div className="big-number">{formatINR(total)}</div>
      </div>
      <div className="card">
        <h2>Budget vs spent</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Budget</th>
                <th className="num">Spent</th>
                <th className="num">Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.category_id}>
                  <td><span className="chip">{r.category_name}</span></td>
                  <td className="num">{formatINR(r.budget)}</td>
                  <td className="num strong">{formatINR(r.spent)}</td>
                  <td className={`num ${Number(r.remaining) < 0 ? "neg" : ""}`}>{formatINR(r.remaining)}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h2>Spending vs budget chart</h2>
        <BudgetChart rows={rows} />
      </div>
    </div>
  );
}
