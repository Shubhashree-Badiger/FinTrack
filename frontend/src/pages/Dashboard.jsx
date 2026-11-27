import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { api } from "../api.js";
import { formatINR, monthLabel } from "../format.js";
import { Icon } from "../icons.jsx";
import AlertBanner from "../components/AlertBanner.jsx";
import { Empty, ErrorNote, Loading, StatusBadge, UsageBar } from "../components/ui.jsx";
import { CAT_COLORS, Ring, SpendBar } from "../components/viz.jsx";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// "Today", "Yesterday" or "12 Nov" for grouping the activity list.
function dayLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  const diff = Math.round((new Date().setHours(0, 0, 0, 0) - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
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
      api.getGoals(),
    ])
      .then(([alerts, rows, total, expenses, categories, goals]) => {
        if (!cancelled) setData({ alerts, rows, total: Number(total.total), expenses, categories, goals });
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [month]);

  if (error) return <ErrorNote message={error} />;
  if (!data) return <Loading text="Loading your dashboard..." />;

  const { alerts, rows, total, expenses, categories, goals } = data;
  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const today = new Date();
  const isCurrent = today.getFullYear() === year && today.getMonth() + 1 === mon;
  const elapsed = Math.max(1, isCurrent ? today.getDate() : daysInMonth);

  const budgeted = rows.filter((r) => r.budget !== null);
  const totalBudget = budgeted.reduce((s, r) => s + Number(r.budget), 0);
  const spentOnBudgeted = budgeted.reduce((s, r) => s + Number(r.spent), 0);
  const usedPct = totalBudget > 0 ? (spentOnBudgeted / totalBudget) * 100 : 0;
  const left = totalBudget - spentOnBudgeted;
  const projected = isCurrent ? (total / elapsed) * daysInMonth : total;
  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const colorOf = Object.fromEntries(rows.map((r, i) => [r.category_id, CAT_COLORS[i % CAT_COLORS.length]]));
  const segments = rows
    .filter((r) => Number(r.spent) > 0)
    .sort((a, b) => Number(b.spent) - Number(a.spent))
    .map((r) => ({ name: r.category_name, value: Number(r.spent), color: colorOf[r.category_id] }));

  const perDay = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: 0 }));
  expenses.forEach((e) => {
    perDay[Number(e.spent_on.slice(8, 10)) - 1].amount += Number(e.amount);
  });

  const grouped = [];
  expenses.slice(0, 8).forEach((e) => {
    const label = dayLabel(e.spent_on);
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) last.items.push(e);
    else grouped.push({ label, items: [e] });
  });

  const brandNew = expenses.length === 0 && budgeted.length === 0;
  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <div className="dash">
      <div className="hello">
        <p className="muted">{greeting()},</p>
        <h1>{firstName}</h1>
      </div>

      <AlertBanner alerts={alerts} />

      {brandNew ? (
        <div className="card">
          <Empty icon="trend" title="Your account is ready">
            Pick one of these to get your dashboard going.
          </Empty>
          <div className="steps">
            <button className="step" onClick={() => go("budgets")}>
              <span className="step-n">1</span>
              <strong>Set a monthly budget</strong>
              <span className="muted">Choose a category and an amount in rupees.</span>
            </button>
            <button className="step" onClick={() => go("expenses")}>
              <span className="step-n">2</span>
              <strong>Log an expense</strong>
              <span className="muted">Add what you spent today.</span>
            </button>
            <button className="step" onClick={() => go("import")}>
              <span className="step-n">3</span>
              <strong>Import a statement</strong>
              <span className="muted">Upload a CSV from your bank.</span>
            </button>
            <button className="step" onClick={() => go("goals")}>
              <span className="step-n">4</span>
              <strong>Start a savings goal</strong>
              <span className="muted">Track progress toward something big.</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="card overview">
            <div className="overview-main">
              <span className="eyebrow">Spent in {monthLabel(month)}</span>
              <div className="figure">{formatINR(total)}</div>
              {totalBudget > 0 ? (
                <p className="muted">
                  {left >= 0 ? <><b>{formatINR(left)}</b> left of your {formatINR(totalBudget)} budget</>
                    : <><b className="neg">{formatINR(-left)}</b> over your {formatINR(totalBudget)} budget</>}
                </p>
              ) : (
                <p className="muted">No budgets set for this month yet.</p>
              )}
              {isCurrent && total > 0 && (
                <p className={`pace ${totalBudget > 0 && projected > totalBudget ? "warn" : ""}`}>
                  <Icon name="trend" size={16} />
                  At this pace you will spend about {formatINR(Math.round(projected))} by month end
                  {totalBudget > 0 && projected > totalBudget ? ", which is above your budget." : "."}
                </p>
              )}
            </div>
            {totalBudget > 0 && <Ring pct={usedPct} />}
            <div className="overview-split">
              <SpendBar segments={segments} />
            </div>
          </section>

          <div className="dash-cols">
            <div className="col">
              <section className="card">
                <div className="card-head">
                  <h2>Day by day</h2>
                  <span className="muted small">Avg {formatINR(Math.round(total / elapsed))} a day</span>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={perDay} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} interval={4} fontSize={12} stroke="#8a968f" />
                    <Tooltip
                      formatter={(v) => [formatINR(v), "Spent"]}
                      labelFormatter={(d) => `${d} ${monthLabel(month).split(" ")[0]}`}
                      cursor={{ fill: "rgba(15,92,71,0.07)" }}
                    />
                    <Bar dataKey="amount" fill="#0f5c47" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>

              <section className="card">
                <div className="card-head">
                  <h2>Recent activity</h2>
                  <button className="link-btn" onClick={() => go("expenses")}>See all</button>
                </div>
                {expenses.length === 0 ? (
                  <Empty icon="expenses" title="Nothing logged yet">No expenses in {monthLabel(month)}.</Empty>
                ) : (
                  grouped.map((g) => (
                    <div key={g.label} className="day-group">
                      <div className="day-label">{g.label}</div>
                      <ul className="txns">
                        {g.items.map((e) => (
                          <li key={e.id}>
                            <i className="dot" style={{ background: colorOf[e.category_id] }} />
                            <div className="txn-main">
                              <strong>{e.description || names[e.category_id]}</strong>
                              <span className="muted small">{names[e.category_id]}</span>
                            </div>
                            <span className="strong">{formatINR(e.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </section>
            </div>

            <div className="col">
              <section className="card">
                <div className="card-head">
                  <h2>Budgets</h2>
                  <button className="link-btn" onClick={() => go("budgets")}>Manage</button>
                </div>
                {rows.length === 0 ? (
                  <Empty icon="budgets" title="No categories yet">Add one on the Budgets page.</Empty>
                ) : (
                  <ul className="cat-list">
                    {rows.map((r) => (
                      <li key={r.category_id}>
                        <div className="cat-row">
                          <i className="dot" style={{ background: colorOf[r.category_id] }} />
                          <strong>{r.category_name}</strong>
                          <span className="muted small">
                            {formatINR(r.spent)}{r.budget !== null && ` / ${formatINR(r.budget)}`}
                          </span>
                          {r.status !== "ok" && <StatusBadge status={r.status} />}
                        </div>
                        {r.budget !== null && <UsageBar spent={r.spent} budget={r.budget} status={r.status} />}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card">
                <div className="card-head">
                  <h2>Savings goals</h2>
                  <button className="link-btn" onClick={() => go("goals")}>Open</button>
                </div>
                {goals.length === 0 ? (
                  <p className="muted">No goals yet. Start one to see your progress here.</p>
                ) : (
                  <ul className="cat-list">
                    {goals.slice(0, 3).map((g) => (
                      <li key={g.id}>
                        <div className="cat-row">
                          <strong>{g.name}</strong>
                          <span className="muted small">{formatINR(g.saved_amount)} / {formatINR(g.target_amount)}</span>
                        </div>
                        <div className="usage"><div className="usage-fill brand" style={{ width: `${g.progress_pct}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
