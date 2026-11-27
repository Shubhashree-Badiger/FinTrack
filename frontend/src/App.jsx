import { useEffect, useState } from "react";
import { api, session } from "./api.js";
import { Icon, Logo } from "./icons.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Budgets from "./pages/Budgets.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Goals from "./pages/Goals.jsx";
import Landing from "./pages/Landing.jsx";
import Reports from "./pages/Reports.jsx";

const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "expenses", label: "Expenses", icon: "expenses" },
  { id: "budgets", label: "Budgets", icon: "budgets" },
  { id: "reports", label: "Reports", icon: "reports" },
  { id: "goals", label: "Goals", icon: "goals" },
];

// Current month as YYYY-MM, the format used by the API.
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// The signed-in application: sidebar navigation plus the selected page.
function Shell({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [month, setMonth] = useState(currentMonth());
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (id) => {
    setPage(id);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand light"><Logo size={36} /><span>FinTrack</span></div>
        <nav>
          {PAGES.map((p) => (
            <button key={p.id} className={page === p.id ? "nav active" : "nav"} onClick={() => go(p.id)}>
              <Icon name={p.icon} size={20} /> {p.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar">{(user.name || "?").charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.is_demo ? "Demo account" : `@${user.username}`}</span>
            </div>
          </div>
          <button className="nav" onClick={onLogout}><Icon name="logout" size={20} /> Sign out</button>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name="menu" size={24} />
          </button>
          <div className="brand mobile-brand"><Logo size={28} /><span>FinTrack</span></div>
          <label className="month-picker">
            <span>Month</span>
            <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          </label>
        </header>
        {user.is_demo && (
          <div className="demo-banner">
            <Icon name="play" size={16} />
            You are exploring the demo with sample data. <button className="link-btn" onClick={onLogout}>Create your own account</button>
          </div>
        )}
        <main>
          {page === "dashboard" && <Dashboard month={month} user={user} go={go} />}
          {page === "expenses" && <Expenses month={month} />}
          {page === "budgets" && <Budgets month={month} />}
          {page === "reports" && <Reports month={month} />}
          {page === "goals" && <Goals />}
        </main>
      </div>
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => (session.token() ? session.user() : null));
  const [view, setView] = useState("landing"); // landing | login | signup
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState("");

  // If the API reports an expired token, drop back to the sign-in screen.
  useEffect(() => {
    session.onExpired = () => {
      setUser(null);
      setView("login");
    };
  }, []);

  function authed(result) {
    session.save(result);
    setUser(result.user);
  }

  function logout() {
    session.clear();
    setUser(null);
    setView("landing");
  }

  async function demo() {
    setDemoLoading(true);
    setDemoError("");
    try {
      authed(await api.demoLogin());
    } catch (e) {
      setDemoError(e.message);
    } finally {
      setDemoLoading(false);
    }
  }

  if (user) return <Shell user={user} onLogout={logout} />;

  return (
    <>
      {demoError && <div className="toast" role="alert">{demoError}</div>}
      {view === "landing" ? (
        <Landing
          onLogin={() => setView("login")}
          onSignup={() => setView("signup")}
          onDemo={demo}
          demoLoading={demoLoading}
        />
      ) : (
        <AuthPage
          mode={view}
          setMode={setView}
          onAuthed={authed}
          onDemo={demo}
          demoLoading={demoLoading}
          onBack={() => setView("landing")}
        />
      )}
    </>
  );
}
