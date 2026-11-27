import { useState } from "react";
import { monthLabel } from "../format.js";

// Form to set the budget of one category for the selected month.
export default function BudgetForm({ categories, month, initial, onSubmit }) {
  const [categoryId, setCategoryId] = useState(initial ? initial.category_id : "");
  const [amount, setAmount] = useState(initial ? initial.amount : "");

  function handleSubmit(e) {
    e.preventDefault();
    const [year, mon] = month.split("-").map(Number);
    onSubmit({ category_id: Number(categoryId), year, month: mon, amount });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Category
        <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label>
        Budget for {monthLabel(month)} (₹)
        <input type="number" step="0.01" min="0.01" required placeholder="e.g. 5000" value={amount}
          onChange={(e) => setAmount(e.target.value)} />
      </label>
      <button type="submit">Save budget</button>
    </form>
  );
}
