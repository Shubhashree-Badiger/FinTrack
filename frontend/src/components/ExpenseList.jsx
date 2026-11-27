// Table of expenses with edit and delete actions.
export default function ExpenseList({ expenses, categories, onEdit, onDelete }) {
  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  if (expenses.length === 0) return <p className="muted">No expenses for this month.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Description</th>
          <th>Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((e) => (
          <tr key={e.id}>
            <td>{e.spent_on}</td>
            <td>{names[e.category_id]}</td>
            <td>{e.description}</td>
            <td>{e.amount}</td>
            <td className="actions">
              <button className="secondary" onClick={() => onEdit(e)}>Edit</button>
              <button className="danger" onClick={() => onDelete(e.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
