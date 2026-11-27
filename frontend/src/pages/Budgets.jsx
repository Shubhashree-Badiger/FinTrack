import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import BudgetForm from "../components/BudgetForm.jsx";

export default function Budgets({ month }) {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [cats, buds] = await Promise.all([api.getCategories(), api.getBudgets(month)]);
      setCategories(cats);
      setBudgets(buds);
    } catch (e) {
      setError(e.message);
    }
  }, [month]);

  useEffect(() => {
    setSelected(null);
    load();
  }, [load]);

  async function save(payload) {
    setError("");
    try {
      await api.saveBudget(payload);
      setSelected(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h2>Set budget</h2>
        <BudgetForm
          key={selected ? selected.id : "new"}
          categories={categories}
          month={month}
          initial={selected}
          onSubmit={save}
        />
      </div>
      <div className="card">
        <h2>Budgets for {month}</h2>
        {budgets.length === 0 ? (
          <p className="muted">No budgets set for this month.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Category</th><th>Budget</th><th></th></tr>
            </thead>
            <tbody>
              {budgets.map((b) => (
                <tr key={b.id}>
                  <td>{names[b.category_id]}</td>
                  <td>{b.amount}</td>
                  <td className="actions">
                    <button className="secondary" onClick={() => setSelected(b)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
