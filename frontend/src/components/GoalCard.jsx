import { useState } from "react";

// One savings goal with a progress bar and a contribute form.
export default function GoalCard({ goal, onContribute }) {
  const [amount, setAmount] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (await onContribute(goal.id, amount)) setAmount("");
  }

  return (
    <div className="card">
      <h2>{goal.name}</h2>
      <div className="progress">
        <div style={{ width: `${goal.progress_pct}%` }} />
      </div>
      <p>
        {goal.saved_amount} of {goal.target_amount} ({goal.progress_pct}%)
      </p>
      {goal.deadline && <p className="muted">Deadline: {goal.deadline}</p>}
      <form className="form" onSubmit={handleSubmit}>
        <input type="number" step="0.01" min="0.01" required placeholder="Amount" value={amount}
          onChange={(e) => setAmount(e.target.value)} />
        <button type="submit">Contribute</button>
      </form>
    </div>
  );
}
