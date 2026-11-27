import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatDate, formatINR, monthLabel } from "../format.js";
import { Icon } from "../icons.jsx";
import AlertBanner from "../components/AlertBanner.jsx";
import { Empty, ErrorNote, Loading, PageHeader, StatusBadge, UsageBar } from "../components/ui.jsx";

function Stat({ icon, label, value, tone = "" }) {
  return (
    <div className={`stat ${tone}`}>
      <div className="stat-icon"><Icon name={icon} size={22} /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard({ month, user, go }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    Promise.all([
      api.getAlerts(month),
      api.getBudgetVsSpend(month),
      api.getMonthlyTotal(month),
      api.getExpenses(month),
      api.getCategories(),
    ])
      .then(([alerts, rows, total, expenses, categories]) => {
        if (!cancelled) setData({ alerts, rows, total: total.total, expenses, categories });
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [month]);

  if (error) return <ErrorNote message={error} />;
  if (!data) return <Loading text="Loading your dashboard..." />;

  const { alerts, rows, total, expenses, categories } = data;
  const budgeted = rows.filter((r) => r.budget !== null);
  const totalBudget = budgeted.reduce((s, r) => s + Number(r.budget), 0);
  const spentOnBudgeted = budgeted.reduce((s, r) => s + Number(r.spent), 0);
  const remaining = totalBudget - spentOnBudgeted;
  const attention = alerts.filter((a) => a.status === "low" || a.status === "exceeded").length;
  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const firstName = (user?.name || "there").split(" ")[0];
  const isBrandNew = expenses.length === 0 && budgeted.length === 0;

  return (
    <div>
      <PageHeader title={`Hello, ${firstName}`} subtitle={`Your money in ${monthLabel(month)}`}>
        <button onClick={() => go("expenses")}><Icon name="plus" size={18} /> Add expense</button>
      </PageHeader>

      <AlertBanner alerts={alerts} />

      {isBrandNew ? (
        <div className="card">
          <Empty icon="trend" title="Welcome to FinTrack" action={null}>
            Your account is ready. Three quick steps and your dashboard comes alive.
          </Empty>
          <div className="steps">
            <button className="step" onClick={() => go("budgets")}>
              <span className="step-n">1</span>
              <strong>Set a monthly budget</strong>
              <span className="muted">Pick a category and an amount in rupees.</span>
            </button>
            <button className="step" onClick={() => go("expenses")}>
              <span className="step-n">2</span>
              <strong>Log an expense</strong>
              <span className="muted">Add what you spent today.</span>
            </button>
            <button className="step" onClick={() => go("goals")}>
              <span className="step-n">3</span>
              <strong>Create a savings goal</strong>
              <span className="muted">Track progress toward something big.</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="stats">
            <Stat icon="rupee" label="Spent this month" value={formatINR(total)} tone="brand" />
            <Stat icon="budgets" label="Total budget" value={totalBudget > 0 ? formatINR(totalBudget) : "Not set"} />
            <Stat icon="piggy" label={remaining < 0 ? "Over budget by" : "Left to spend"}
              value={totalBudget > 0 ? formatINR(Math.abs(remaining)) : "-"}
              tone={remaining < 0 ? "bad" : "good"} />
            <Stat icon="bell" label="Needs attention" value={attention === 0 ? "All good" : `${attention} budget${attention > 1 ? "s" : ""}`}
              tone={attention ? "warn" : "good"} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h2>Budget vs spend</h2>
              {rows.length === 0 ? (
                <Empty icon="budgets" title="No categories yet">Add a category on the Budgets page.</Empty>
              ) : (
                <ul className="cat-list">
                  {rows.map((r) => (
                    <li key={r.category_id}>
                      <div className="cat-row">
                        <strong>{r.category_name}</strong>
                        <span className="muted">
                          {formatINR(r.spent)}{r.budget !== null && ` of ${formatINR(r.budget)}`}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      {r.budget !== null && <UsageBar spent={r.spent} budget={r.budget} status={r.status} />}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <div className="card-head">
                <h2>Recent expenses</h2>
                <button className="link-btn" onClick={() => go("expenses")}>View all</button>
              </div>
              {expenses.length === 0 ? (
                <Empty icon="expenses" title="No expenses yet">Nothing logged in {monthLabel(month)}.</Empty>
              ) : (
                <ul className="recent">
                  {expenses.slice(0, 6).map((e) => (
                    <li key={e.id}>
                      <div>
                        <strong>{e.description || names[e.category_id]}</strong>
                        <div className="muted small">{names[e.category_id]} · {formatDate(e.spent_on)}</div>
                      </div>
                      <span className="strong">{formatINR(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
