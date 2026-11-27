import { useState } from "react";
import Budgets from "./pages/Budgets.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Goals from "./pages/Goals.jsx";
import Reports from "./pages/Reports.jsx";

const PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "expenses", label: "Expenses" },
  { id: "budgets", label: "Budgets" },
  { id: "reports", label: "Reports" },
  { id: "goals", label: "Goals" },
];

// Current month as YYYY-MM, the format used by the API.
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [month, setMonth] = useState(currentMonth());

  return (
    <div className="app">
      <header className="topbar">
        <h1>FinTrack</h1>
        <nav>
          {PAGES.map((p) => (
            <button
              key={p.id}
              className={page === p.id ? "nav active" : "nav"}
              onClick={() => setPage(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <label className="month-picker">
          Month
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </label>
      </header>
      <main>
        {page === "dashboard" && <Dashboard month={month} />}
        {page === "reports" && <Reports month={month} />}
        {page === "goals" && <Goals />}
        {page === "expenses" && <Expenses month={month} />}
        {page === "budgets" && <Budgets month={month} />}
      </main>
    </div>
  );
}
