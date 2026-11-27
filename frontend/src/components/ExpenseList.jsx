import { Icon } from "../icons.jsx";
import { formatDate, formatINR } from "../format.js";
import { Empty } from "./ui.jsx";

// List of expenses with edit and delete actions. Works as a compact list on phones too.
export default function ExpenseList({ expenses, categories, onEdit, onDelete }) {
  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  if (expenses.length === 0) {
    return (
      <Empty icon="expenses" title="No expenses this month">
        Tap the + button to log your first expense, or import a bank statement. Budgets and alerts update instantly.
      </Empty>
    );
  }
  return (
    <ul className="expense-list">
      {expenses.map((e) => (
        <li key={e.id}>
          <div className="exp-main">
            <strong>{e.description || names[e.category_id]}</strong>
            <span className="muted small">
              <span className="chip">{names[e.category_id]}</span> {formatDate(e.spent_on)}
            </span>
          </div>
          <span className="strong exp-amt">{formatINR(e.amount)}</span>
          <div className="actions">
            <button className="icon-btn" aria-label="Edit expense" title="Edit" onClick={() => onEdit(e)}>
              <Icon name="edit" size={18} />
            </button>
            <button className="icon-btn danger" aria-label="Delete expense" title="Delete"
              onClick={() => window.confirm("Delete this expense?") && onDelete(e.id)}>
              <Icon name="trash" size={18} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
