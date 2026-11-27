import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import GoalCard from "../components/GoalCard.jsx";
import { Empty, ErrorNote, Loading, PageHeader } from "../components/ui.jsx";

export default function Goals() {
  const [goals, setGoals] = useState(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.getGoals().then(setGoals).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function createGoal(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createGoal({ name, target_amount: target, deadline: deadline || null });
      setName("");
      setTarget("");
      setDeadline("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  // Returns true on success so the card can clear its input.
  async function contribute(id, amount) {
    setError("");
    try {
      await api.contribute(id, amount);
      load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  return (
    <div>
      <PageHeader title="Savings goals" subtitle="Set a target and add money as you save." />
      <ErrorNote message={error} onClose={() => setError("")} />
      <div className="card">
        <h2>New savings goal</h2>
        <form className="form" onSubmit={createGoal}>
          <label className="grow">
            Goal name
            <input type="text" required maxLength={100} placeholder="e.g. Emergency fund" value={name}
              onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Target amount (₹)
            <input type="number" step="0.01" min="0.01" required placeholder="e.g. 50000" value={target}
              onChange={(e) => setTarget(e.target.value)} />
          </label>
          <label>
            Target date (optional)
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
          <button type="submit">Create goal</button>
        </form>
      </div>
      {goals === null ? (
        <Loading text="Loading goals..." />
      ) : goals.length === 0 ? (
        <div className="card">
          <Empty icon="goals" title="No savings goals yet">
            Create your first goal above, for example a trip, a gadget or an emergency fund.
          </Empty>
        </div>
      ) : (
        <div className="goal-grid">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onContribute={contribute} />
          ))}
        </div>
      )}
    </div>
  );
}
