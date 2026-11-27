import { useEffect, useState } from "react";
import { api, session } from "./api.js";
import { useInstall } from "./install.js";
import { Icon, Logo } from "./icons.jsx";
import ExpenseForm from "./components/ExpenseForm.jsx";
import Sheet from "./components/Sheet.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Budgets from "./pages/Budgets.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Goals from "./pages/Goals.jsx";
import Import from "./pages/Import.jsx";
import Landing from "./pages/Landing.jsx";
import Reports from "./pages/Reports.jsx";

const PAGES = [
  { id: "dashboard", label: "Home", icon: "home" },
  { id: "expenses", label: "Expenses", icon: "expenses" },
  { id: "budgets", label: "Budgets", icon: "budgets" },
  { id: "reports", label: "Reports", icon: "reports" },
  { id: "goals", label: "Goals", icon: "goals" },
  { id: "import", label: "Import", icon: "upload" },
];
// Tabs shown on the phone's bottom bar; everything else lives under "More".
const TABS = ["dashboard", "expenses", "reports"];

// Current month as YYYY-MM, the format used by the API.
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function InstallRow({ install, className = "nav" }) {
  const { canPrompt, installed, iosHint, install: run } = install;
  if (installed || (!canPrompt && !iosHint)) return null;
  return (
    <button
      className={className}
      onClick={() =>
        canPrompt ? run() : window.alert("To install: tap the Share button, then 'Add to Home Screen'.")
      }
    >
      <Icon name="download" size={20} /> Install app
    </button>
  );
}

// The signed-in application: sidebar on desktop, app bar plus bottom tabs on phones.
function Shell({ user, onLogout }) {
  // Deep links such as /#import open that page directly.
  const [page, setPage] = useState(() => {
    const wanted = window.location.hash.slice(1);
    return PAGES.some((p) => p.id === wanted) ? wanted : "dashboard";
  });
  const [month, setMonth] = useState(currentMonth());
  const [refresh, setRefresh] = useState(0);
  const [addOpen, setAddOpen] = useState(() => new URLSearchParams(window.location.search).has("add"));
  const [moreOpen, setMoreOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null);
  const install = useInstall();

  const go = (id) => {
    setPage(id);
    setMoreOpen(false);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (window.location.search) window.history.replaceState({}, "", "/");
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  async function openAdd() {
    setAddOpen(true);
    try {
      setCategories(await api.getCategories());
    } catch {
      /* the form still opens; the category list will be empty */
    }
  }
  useEffect(() => {
    if (addOpen && categories.length === 0) api.getCategories().then(setCategories).catch(() => {});
  }, [addOpen, categories.length]);

  async function quickSave(payload) {
    try {
      const saved = await api.createExpense(payload);
      setAddOpen(false);
      setRefresh((n) => n + 1);
      const a = saved.alert;
      if (a.status === "exceeded") setToast({ tone: "bad", text: `${a.category_name} is over budget.` });
      else if (a.status === "low") setToast({ tone: "warn", text: `${a.category_name}: only ${a.remaining_pct}% of the budget is left.` });
      else setToast({ tone: "ok", text: "Expense added." });
      return true;
    } catch (e) {
      setToast({ tone: "bad", text: e.message });
      return false;
    }
  }

  const monthPicker = (
    <label className="month-picker">
      <span>Month</span>
      <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
    </label>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand light"><Logo size={34} /><span>FinTrack</span></div>
        <button className="add-btn" onClick={openAdd}><Icon name="plus" size={18} /> Add expense</button>
        <nav>
          {PAGES.map((p) => (
            <button key={p.id} className={page === p.id ? "nav active" : "nav"} onClick={() => go(p.id)}>
              <Icon name={p.icon} size={20} /> {p.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <InstallRow install={install} />
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
        <header className="appbar">
          <div className="brand mobile-brand"><Logo size={30} /><span>FinTrack</span></div>
          {monthPicker}
        </header>
        {user.is_demo && (
          <div className="demo-banner">
            You are exploring the demo with sample data.{" "}
            <button className="link-btn" onClick={onLogout}>Create your own account</button>
          </div>
        )}
        <main key={`${page}-${refresh}`} className="page">
          {page === "dashboard" && <Dashboard month={month} user={user} go={go} />}
          {page === "expenses" && <Expenses month={month} />}
          {page === "budgets" && <Budgets month={month} />}
          {page === "reports" && <Reports month={month} />}
          {page === "goals" && <Goals />}
          {page === "import" && <Import go={go} onChanged={() => setRefresh((n) => n + 1)} />}
        </main>
      </div>

      <nav className="tabbar" aria-label="Main">
        {PAGES.filter((p) => TABS.slice(0, 2).includes(p.id)).map((p) => (
          <button key={p.id} className={page === p.id ? "tab active" : "tab"} onClick={() => go(p.id)}>
            <Icon name={p.icon} size={22} /><span>{p.label}</span>
          </button>
        ))}
        <button className="tab fab" onClick={openAdd} aria-label="Add expense"><Icon name="plus" size={26} /></button>
        <button className={page === "reports" ? "tab active" : "tab"} onClick={() => go("reports")}>
          <Icon name="reports" size={22} /><span>Reports</span>
        </button>
        <button className={moreOpen || ["budgets", "goals", "import"].includes(page) ? "tab active" : "tab"}
          onClick={() => setMoreOpen(true)}>
          <Icon name="more" size={22} /><span>More</span>
        </button>
      </nav>

      {addOpen && (
        <Sheet title="Add an expense" onClose={() => setAddOpen(false)}>
          <ExpenseForm categories={categories} initial={null} defaultDate={todayISO()} onSubmit={quickSave} onCancel={null} />
        </Sheet>
      )}

      {moreOpen && (
        <Sheet title="More" onClose={() => setMoreOpen(false)}>
          <div className="more-list">
            {PAGES.filter((p) => ["budgets", "goals", "import"].includes(p.id)).map((p) => (
              <button key={p.id} className="more-item" onClick={() => go(p.id)}>
                <Icon name={p.icon} size={22} /> {p.label}
              </button>
            ))}
            <InstallRow install={install} className="more-item" />
            <button className="more-item" onClick={onLogout}><Icon name="logout" size={22} /> Sign out ({user.name})</button>
          </div>
        </Sheet>
      )}

      {toast && <div className={`snack ${toast.tone}`} role="status">{toast.text}</div>}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => (session.token() ? session.user() : null));
  const [view, setView] = useState("landing"); // landing | login | signup
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState("");
  const install = useInstall();

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
          install={install}
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
