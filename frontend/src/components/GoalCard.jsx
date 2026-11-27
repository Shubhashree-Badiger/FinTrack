import { useState } from "react";
import { formatDate, formatINR } from "../format.js";

// One savings goal with a progress bar and a contribute form.
export default function GoalCard({ goal, onContribute }) {
  const [amount, setAmount] = useState("");
  const done = goal.progress_pct >= 100;

  async function handleSubmit(e) {
    e.preventDefault();
    if (await onContribute(goal.id, amount)) setAmount("");
  }

  return (
    <div className="card goal">
      <div className="goal-top">
        <h3>{goal.name}</h3>
        {done && <span className="badge ok">Goal reached</span>}
      </div>
      <div className="goal-amounts">
        <strong>{formatINR(goal.saved_amount)}</strong>
        <span className="muted"> saved of {formatINR(goal.target_amount)}</span>
      </div>
      <div className="usage tall" aria-label={`${goal.progress_pct}% saved`}>
        <div className={`usage-fill ${done ? "ok" : "brand"}`} style={{ width: `${goal.progress_pct}%` }} />
      </div>
      <div className="goal-meta">
        <span>{goal.progress_pct}%</span>
        {goal.deadline && <span className="muted">Target date {formatDate(goal.deadline)}</span>}
      </div>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input type="number" step="0.01" min="0.01" required placeholder="Add amount (₹)"
          value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
