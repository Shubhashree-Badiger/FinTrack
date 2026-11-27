import { useState } from "react";

// Form to add an expense, or edit one when `initial` is given.
export default function ExpenseForm({ categories, initial, defaultDate, onSubmit, onCancel }) {
  const [amount, setAmount] = useState(initial ? initial.amount : "");
  const [categoryId, setCategoryId] = useState(initial ? initial.category_id : "");
  const [spentOn, setSpentOn] = useState(initial ? initial.spent_on : defaultDate);
  const [description, setDescription] = useState(initial ? initial.description : "");

  async function handleSubmit(e) {
    e.preventDefault();
    const saved = await onSubmit({
      amount,
      category_id: Number(categoryId),
      spent_on: spentOn,
      description,
    });
    if (saved && !initial) {
      setAmount("");
      setDescription("");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Amount
        <input type="number" step="0.01" min="0.01" required value={amount}
          onChange={(e) => setAmount(e.target.value)} />
      </label>
      <label>
        Category
        <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label>
        Date
        <input type="date" required value={spentOn} onChange={(e) => setSpentOn(e.target.value)} />
      </label>
      <label>
        Description
        <input type="text" maxLength={255} value={description}
          onChange={(e) => setDescription(e.target.value)} />
      </label>
      <button type="submit">{initial ? "Save" : "Add expense"}</button>
      {onCancel && (
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      )}
    </form>
  );
}
