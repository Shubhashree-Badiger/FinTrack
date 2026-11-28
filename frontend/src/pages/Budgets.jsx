import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";

// Set a monthly budget for each category in the selected month.
export default function Budgets({ month }) {
  const [categories, setCategories] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [cats, budgets] = await Promise.all([api.getCategories(), api.getBudgets(month)]);
      setCategories(cats);
      setAmounts(Object.fromEntries(budgets.map((b) => [b.category_id, b.amount])));
    } catch (e) {
      setError(e.message);
    }
  }, [month]);

  useEffect(() => {
    setMessage("");
    setError("");
    load();
  }, [load]);

  async function save(category) {
    setMessage("");
    setError("");
    const [year, mon] = month.split("-").map(Number);
    try {
      await api.setBudget({ category_id: category.id, year, month: mon, amount: amounts[category.id] });
      setMessage(`Saved ${category.name} budget for ${month}.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="card">
      <h2>Budgets for {month}</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>Category</th><th>Monthly budget</th><th></th></tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                <input type="number" step="0.01" min="0.01" placeholder="Not set"
                  value={amounts[c.id] ?? ""}
                  onChange={(e) => setAmounts({ ...amounts, [c.id]: e.target.value })} />
              </td>
              <td>
                <button disabled={!amounts[c.id]} onClick={() => save(c)}>Save</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
