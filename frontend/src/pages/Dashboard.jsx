import { useEffect, useState } from "react";
import { api } from "../api.js";

// Basic reports: total spending for the month and spending vs budget per category.
export default function Dashboard({ month }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api.getSummary(month).then(setSummary).catch((e) => setError(e.message));
  }, [month]);

  if (error) return <p className="error">{error}</p>;
  if (!summary) return <p className="muted">Loading…</p>;

  const exceeded = summary.categories.filter((c) => c.status === "exceeded");

  return (
    <div>
      {exceeded.map((c) => (
        <div key={c.category_id} className="alert">
          {c.category_name}: budget exceeded. Spent {c.spent} of {c.budget}.
        </div>
      ))}
      <div className="card">
        <h2>Total spending for {month}</h2>
        <div className="big">{summary.total_spent}</div>
      </div>
      <div className="card">
        <h2>Spending vs budget</h2>
        <table>
          <thead>
            <tr><th>Category</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Status</th></tr>
          </thead>
          <tbody>
            {summary.categories.map((c) => (
              <tr key={c.category_id}>
                <td>{c.category_name}</td>
                <td>{c.budget ?? "-"}</td>
                <td>{c.spent}</td>
                <td>{c.remaining ?? "-"}</td>
                <td><span className={`badge ${c.status}`}>{c.status.replace("_", " ")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
