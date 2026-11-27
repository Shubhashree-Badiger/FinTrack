import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import GoalCard from "../components/GoalCard.jsx";

export default function Goals() {
  const [goals, setGoals] = useState([]);
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
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h2>New savings goal</h2>
        <form className="form" onSubmit={createGoal}>
          <label>
            Name
            <input type="text" required maxLength={100} value={name}
              onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Target amount
            <input type="number" step="0.01" min="0.01" required value={target}
              onChange={(e) => setTarget(e.target.value)} />
          </label>
          <label>
            Deadline (optional)
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
          <button type="submit">Create goal</button>
        </form>
      </div>
      {goals.length === 0 && <p className="muted">No savings goals yet.</p>}
      <div className="goal-grid">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} onContribute={contribute} />
        ))}
      </div>
    </div>
  );
}
