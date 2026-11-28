import { useState } from "react";
import { getName, getToken, logout } from "./api.js";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Budgets from "./pages/Budgets.jsx";

const PAGES = { dashboard: "Dashboard", expenses: "Expenses", budgets: "Budgets" };

// Current month as YYYY-MM, the format used by the API.
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [authPage, setAuthPage] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [month, setMonth] = useState(currentMonth());

  if (!loggedIn) {
    return authPage === "login" ? (
      <Login onDone={() => setLoggedIn(true)} onSwitch={() => setAuthPage("register")} />
    ) : (
      <Register onDone={() => setLoggedIn(true)} onSwitch={() => setAuthPage("login")} />
    );
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setAuthPage("login");
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>FinTrack</h1>
        <nav>
          {Object.entries(PAGES).map(([id, label]) => (
            <button key={id} className={page === id ? "nav active" : "nav"} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </nav>
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <span className="muted">Hi, {getName()}</span>
        <button className="secondary" onClick={handleLogout}>Logout</button>
      </header>
      {page === "dashboard" && <Dashboard month={month} />}
      {page === "expenses" && <Expenses month={month} />}
      {page === "budgets" && <Budgets month={month} />}
    </div>
  );
}
