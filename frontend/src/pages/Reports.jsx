import { useEffect, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../api.js";
import { formatINR, monthLabel } from "../format.js";
import { Icon, categoryIconName } from "../icons.jsx";
import { Empty, ErrorNote, Loading, PageHeader, StatusBadge } from "../components/ui.jsx";
import { CAT_COLORS, Ring } from "../components/viz.jsx";

const BUDGET_COLOR = "#3d7ea6";
const SPENT_COLOR = "#0f5c47";
const REMAIN_COLOR = "#cfe6dc";
const compact = (v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${v / 1000}k` : v);

function Tile({ icon, label, value, tone = "" }) {
  return (
    <div className={`rtile ${tone}`}>
      <span className="rtile-ico"><Icon name={icon} size={22} /></span>
      <div>
        <span className="muted small">{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default function Reports({ month }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    Promise.all([api.getBudgetVsSpend(month), api.getMonthlyTotal(month), api.getMonthlyTrend(month, 12)])
      .then(([rows, t, trend]) => !cancelled && setData({ rows, total: Number(t.total), trend }))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [month]);

  if (error) return <ErrorNote message={error} />;
  if (!data) return <Loading text="Building your report..." />;

  const { rows, total, trend } = data;
  const budgeted = rows.filter((r) => r.budget !== null);
  const totalBudget = budgeted.reduce((s, r) => s + Number(r.budget), 0);
  const spentInBudget = budgeted.reduce((s, r) => s + Number(r.spent), 0);
  const remaining = totalBudget - spentInBudget;
  const usedPct = totalBudget > 0 ? (spentInBudget / totalBudget) * 100 : 0;
  const colorOf = Object.fromEntries(rows.map((r, i) => [r.category_id, CAT_COLORS[i % CAT_COLORS.length]]));
  const hasBudget = totalBudget > 0;
  const hasAnything = rows.some((r) => Number(r.spent) > 0 || r.budget !== null);

  const donut = [
    { name: "Spent", value: Math.min(spentInBudget, totalBudget) },
    { name: "Remaining", value: Math.max(remaining, 0) },
  ];
  const bars = budgeted.map((r) => ({ name: r.category_name, Budget: Number(r.budget), Spent: Number(r.spent) }));
  const trendData = trend.map((p) => ({
    label: new Date(`${p.month}-01T00:00:00`).toLocaleString("en-IN", { month: "short" }),
    month: p.month,
    total: Number(p.total),
  }));
  const trendHasData = trendData.some((p) => p.total > 0);

  return (
    <div>
      <PageHeader title="Reports" subtitle={`Spending against budget in ${monthLabel(month)}`} />

      {!hasAnything ? (
        <div className="card">
          <Empty icon="reports" title="Nothing to report for this month">
            Add an expense or set a budget, or pick another month. Your yearly trend is below.
          </Empty>
        </div>
      ) : (
        <>
          <section className="card">
            <h2>Monthly budget utilization</h2>
            <div className="util">
              <Ring pct={usedPct} size={210} center={
                <>
                  <strong className="ring-amt">{formatINR(total)}</strong>
                  {hasBudget && <span className="muted small">of {formatINR(totalBudget)}</span>}
                  <i className="ring-rule" />
                  <b className={usedPct >= 100 ? "neg" : "ring-pct"}>{Math.round(usedPct)}%</b>
                  <span className="muted small">Budget used</span>
                </>
              } />
              <div className="util-tiles">
                <Tile icon="budgets" label="Total budget" value={hasBudget ? formatINR(totalBudget) : "Not set"} />
                <Tile icon="reports" label="Total spent" value={formatINR(total)} tone="blue" />
                <Tile icon={remaining < 0 ? "warning" : "check"} label={remaining < 0 ? "Over budget by" : "Remaining"}
                  value={hasBudget ? formatINR(Math.abs(remaining)) : "-"} tone={remaining < 0 ? "bad" : ""} />
              </div>
            </div>

            <h3 className="sub">Category-wise budget usage</h3>
            <ul className="usage-rows">
              {rows.map((r) => {
                const pct = r.budget ? (Number(r.spent) / Number(r.budget)) * 100 : null;
                return (
                  <li key={r.category_id}>
                    <span className="cat-ico" style={{ background: `${colorOf[r.category_id]}22`, color: colorOf[r.category_id] }}>
                      <Icon name={categoryIconName(r.category_name)} size={20} />
                    </span>
                    <span className="usage-name">{r.category_name}</span>
                    <div className="usage">
                      <div className={`usage-fill ${r.status}`} style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
                    </div>
                    {pct === null ? (
                      <span className="pct-chip none">{formatINR(r.spent)}</span>
                    ) : (
                      <span className={`pct-chip ${r.status}`}>{Math.round(pct)}%</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {hasBudget && (
            <section className="card">
              <div className="card-head">
                <div>
                  <h2>Spending vs budget</h2>
                  <span className="muted small">Category-wise comparison</span>
                </div>
              </div>
              <div className="compare">
                <div className="donut-box">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={donut} dataKey="value" isAnimationActive={false} innerRadius={70} outerRadius={105} startAngle={90} endAngle={-270}
                        paddingAngle={2} stroke="none">
                        <Cell fill={usedPct >= 100 ? "#c4402f" : SPENT_COLOR} />
                        <Cell fill={REMAIN_COLOR} />
                      </Pie>
                      <Tooltip formatter={(v) => formatINR(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <strong>{formatINR(totalBudget)}</strong>
                    <span className="muted small">Total budget</span>
                  </div>
                </div>
                <div className="util-tiles">
                  <Tile icon="expenses" label="Total spent" value={formatINR(spentInBudget)} tone="blue" />
                  <Tile icon="piggy" label={remaining < 0 ? "Over budget by" : "Remaining"} value={formatINR(Math.abs(remaining))}
                    tone={remaining < 0 ? "bad" : ""} />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(220, bars.length * 62)}>
                <BarChart data={bars} layout="vertical" margin={{ top: 8, right: 70, left: 8, bottom: 0 }} barGap={3} barSize={14}>
                  <CartesianGrid horizontal={false} stroke="#ece8de" />
                  <XAxis type="number" tickFormatter={compact} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={118} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => formatINR(v)} cursor={{ fill: "rgba(15,92,71,0.05)" }} />
                  <Legend />
                  <Bar dataKey="Budget" fill={BUDGET_COLOR} radius={[0, 8, 8, 0]} isAnimationActive={false}>
                    <LabelList dataKey="Budget" position="right" formatter={formatINR} fontSize={12} />
                  </Bar>
                  <Bar dataKey="Spent" fill={SPENT_COLOR} radius={[0, 8, 8, 0]} isAnimationActive={false}>
                    <LabelList dataKey="Spent" position="right" formatter={formatINR} fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}
        </>
      )}

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Total spending per month</h2>
            <span className="muted small">The last 12 months up to {monthLabel(month)}</span>
          </div>
        </div>
        {trendHasData ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#0f5c47" stopOpacity={0.28} />
                  <stop offset="1" stopColor="#0f5c47" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#ece8de" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={56} />
              <Tooltip formatter={(v) => [formatINR(v), "Spent"]} labelFormatter={(_, p) => p?.[0] ? monthLabel(p[0].payload.month) : ""} />
              <Area type="monotone" isAnimationActive={false} dataKey="total" stroke="#0f5c47" strokeWidth={2.5} fill="url(#trendFill)"
                dot={{ r: 3, fill: "#0f5c47" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty icon="reports" title="No spending in the last 12 months">Your monthly totals will appear here.</Empty>
        )}
      </section>

      <section className="card">
        <h2>Details</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Budget</th>
                <th className="num">Spent</th>
                <th className="num">Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.category_id}>
                  <td><span className="chip">{r.category_name}</span></td>
                  <td className="num">{formatINR(r.budget)}</td>
                  <td className="num strong">{formatINR(r.spent)}</td>
                  <td className={`num ${Number(r.remaining) < 0 ? "neg" : ""}`}>{formatINR(r.remaining)}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
