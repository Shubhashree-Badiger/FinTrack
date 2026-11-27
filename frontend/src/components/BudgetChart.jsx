import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Bar chart comparing budget and spending per category.
export default function BudgetChart({ rows }) {
  const data = rows.map((r) => ({
    name: r.category_name,
    Budget: r.budget === null ? 0 : Number(r.budget),
    Spent: Number(r.spent),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Budget" fill="#0b6e4f" />
        <Bar dataKey="Spent" fill="#f0a500" />
      </BarChart>
    </ResponsiveContainer>
  );
}
