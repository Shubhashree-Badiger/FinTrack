import { useEffect, useState } from "react";
import { api } from "../api.js";
import AlertBanner from "../components/AlertBanner.jsx";

export default function Dashboard({ month }) {
  const [alerts, setAlerts] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([api.getAlerts(month), api.getBudgetVsSpend(month), api.getMonthlyTotal(month)])
      .then(([a, vs, t]) => {
        setAlerts(a);
        setRows(vs);
        setTotal(t.total);
      })
      .catch((e) => setError(e.message));
  }, [month]);

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <AlertBanner alerts={alerts} />
      <div className="card">
        <h2>Total spending for {month}</h2>
        <div className="big-number">{total}</div>
      </div>
      <div className="card">
        <h2>Budget vs spend</h2>
        <table>
          <thead>
            <tr><th>Category</th><th>Budget</th><th>Spent</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.category_id}>
                <td>{r.category_name}</td>
                <td>{r.budget ?? "-"}</td>
                <td>{r.spent}</td>
                <td><span className={`badge ${r.status}`}>{r.status.replace("_", " ")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
