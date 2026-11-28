import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";

const EMPTY = { amount: "", category_id: "", spent_on: "", description: "" };

// Default date for the form: today if it is in the selected month, else the 1st.
function defaultDate(month) {
  const today = new Date().toISOString().slice(0, 10);
  return today.startsWith(month) ? today : `${month}-01`;
}

export default function Expenses({ month }) {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ ...EMPTY, spent_on: defaultDate(month) });
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [cats, exps] = await Promise.all([api.getCategories(), api.getExpenses(month)]);
      setCategories(cats);
      setExpenses(exps);
    } catch (e) {
      setError(e.message);
    }
  }, [month]);

  useEffect(() => {
    setAlert(null);
    setEditingId(null);
    setForm({ ...EMPTY, spent_on: defaultDate(month) });
    load();
  }, [load, month]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setError("");
    const payload = { ...form, category_id: Number(form.category_id) };
    try {
      const saved = editingId
        ? await api.updateExpense(editingId, payload)
        : await api.createExpense(payload);
      // The backend decides the status; the UI only shows it.
      setAlert(saved.alert.status === "exceeded" ? saved.alert : null);
      setEditingId(null);
      setForm({ ...EMPTY, spent_on: form.spent_on, category_id: form.category_id });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(expense) {
    setEditingId(expense.id);
    setForm({
      amount: expense.amount,
      category_id: String(expense.category_id),
      spent_on: expense.spent_on,
      description: expense.description,
    });
  }

  async function remove(id) {
    setError("");
    try {
      await api.deleteExpense(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addCategory(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createCategory(newCategory);
      setNewCategory("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      {alert && (
        <div className="alert">
          {alert.category_name}: budget exceeded. Spent {alert.spent} of {alert.budget}.
        </div>
      )}
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>{editingId ? "Edit expense" : "Add expense"}</h2>
        <form className="row" onSubmit={save}>
          <label>Amount<input type="number" step="0.01" min="0.01" required value={form.amount} onChange={update("amount")} /></label>
          <label>
            Category
            <select required value={form.category_id} onChange={update("category_id")}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Date<input type="date" required value={form.spent_on} onChange={update("spent_on")} /></label>
          <label>Description<input maxLength={255} value={form.description} onChange={update("description")} /></label>
          <button type="submit">{editingId ? "Save" : "Add"}</button>
          {editingId && (
            <button type="button" className="secondary"
              onClick={() => { setEditingId(null); setForm({ ...EMPTY, spent_on: defaultDate(month) }); }}>
              Cancel
            </button>
          )}
        </form>
        <form className="row" onSubmit={addCategory}>
          <label>New category<input required value={newCategory} onChange={(e) => setNewCategory(e.target.value)} /></label>
          <button type="submit" className="secondary">Add category</button>
        </form>
      </div>

      <div className="card">
        <h2>Expenses for {month}</h2>
        {expenses.length === 0 ? (
          <p className="muted">No expenses for this month.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr>
            </thead>
            <tbody>
              {expenses.map((x) => (
                <tr key={x.id}>
                  <td>{x.spent_on}</td>
                  <td>{names[x.category_id]}</td>
                  <td>{x.description}</td>
                  <td>{x.amount}</td>
                  <td className="actions">
                    <button className="secondary" onClick={() => edit(x)}>Edit</button>
                    <button className="danger" onClick={() => remove(x.id)}>Delete</button>
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
