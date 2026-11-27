import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "../format.js";
import { Empty } from "./ui.jsx";

// Bar chart comparing budget and spending per category. Categories with no data are still drawn
// (as zero) so the chart never breaks; if nothing at all has data, a message is shown instead.
export default function BudgetChart({ rows }) {
  const data = rows.map((r) => ({
    name: r.category_name,
    Budget: r.budget === null || r.budget === undefined ? 0 : Number(r.budget),
    Spent: Number(r.spent) || 0,
  }));
  const hasData = data.some((d) => d.Budget > 0 || d.Spent > 0);
  if (!hasData) {
    return (
      <Empty icon="reports" title="Nothing to chart yet">
        Add an expense or set a budget for this month and the chart will appear here.
      </Empty>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e9f2" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
        />
        <Tooltip formatter={(v) => formatINR(v)} cursor={{ fill: "#f3f6fc" }} />
        <Legend />
        <Bar dataKey="Budget" fill="#3b5bdb" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Spent" fill="#14b88a" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
