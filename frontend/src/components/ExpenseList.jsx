import { Icon } from "../icons.jsx";
import { formatDate, formatINR } from "../format.js";
import { Empty } from "./ui.jsx";

// Table of expenses with edit and delete actions.
export default function ExpenseList({ expenses, categories, onEdit, onDelete }) {
  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  if (expenses.length === 0) {
    return (
      <Empty icon="expenses" title="No expenses this month">
        Use the form above to log your first expense. Budgets and alerts update instantly.
      </Empty>
    );
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th className="num">Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{formatDate(e.spent_on)}</td>
              <td><span className="chip">{names[e.category_id]}</span></td>
              <td>{e.description || <span className="muted">-</span>}</td>
              <td className="num strong">{formatINR(e.amount)}</td>
              <td className="actions">
                <button className="icon-btn" aria-label="Edit expense" title="Edit" onClick={() => onEdit(e)}>
                  <Icon name="edit" size={18} />
                </button>
                <button className="icon-btn danger" aria-label="Delete expense" title="Delete"
                  onClick={() => window.confirm("Delete this expense?") && onDelete(e.id)}>
                  <Icon name="trash" size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
