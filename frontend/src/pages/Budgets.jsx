import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { formatINR, monthLabel } from "../format.js";
import { Icon } from "../icons.jsx";
import BudgetForm from "../components/BudgetForm.jsx";
import { Empty, ErrorNote, Loading, PageHeader } from "../components/ui.jsx";

export default function Budgets({ month }) {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [cats, buds] = await Promise.all([api.getCategories(), api.getBudgets(month)]);
      setCategories(cats);
      setBudgets(buds);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    setLoading(true);
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

  async function addCategory(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createCategory({ name: newCategory });
      setNewCategory("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <PageHeader title="Budgets" subtitle={`Monthly limits for ${monthLabel(month)}. Each month has its own budgets.`} />
      <ErrorNote message={error} onClose={() => setError("")} />
      <div className="grid-2">
        <div className="card">
          <h2>{selected ? "Edit budget" : "Set a budget"}</h2>
          <BudgetForm
            key={selected ? selected.id : "new"}
            categories={categories}
            month={month}
            initial={selected}
            onSubmit={save}
          />
          <hr />
          <h3>Need another category?</h3>
          <form className="inline-form" onSubmit={addCategory}>
            <input type="text" required maxLength={100} placeholder="e.g. Groceries"
              value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button type="submit" className="secondary"><Icon name="plus" size={16} /> Add</button>
          </form>
        </div>
        <div className="card">
          <h2>Budgets for {monthLabel(month)}</h2>
          {loading ? (
            <Loading text="Loading budgets..." />
          ) : budgets.length === 0 ? (
            <Empty icon="budgets" title="No budgets for this month">
              Choose a category and an amount to start. You will get an alert when you are close to the limit.
            </Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Category</th><th className="num">Budget</th><th></th></tr>
                </thead>
                <tbody>
                  {budgets.map((b) => (
                    <tr key={b.id}>
                      <td><span className="chip">{names[b.category_id]}</span></td>
                      <td className="num strong">{formatINR(b.amount)}</td>
                      <td className="actions">
                        <button className="icon-btn" aria-label="Edit budget" title="Edit" onClick={() => setSelected(b)}>
                          <Icon name="edit" size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
