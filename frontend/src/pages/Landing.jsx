import { Icon, Logo } from "../icons.jsx";

const FEATURES = [
  { icon: "expenses", title: "Log daily expenses", text: "Add, edit and delete spending in seconds, sorted into categories like Food, Transport and Bills." },
  { icon: "budgets", title: "Monthly budgets", text: "Set a budget for every category, and a different one for every month." },
  { icon: "bell", title: "Smart alerts", text: "Get warned when a budget is almost used up (10% left) and when you go over it." },
  { icon: "reports", title: "Clear reports", text: "See total spending per month and compare spending with budget in tables and charts." },
  { icon: "goals", title: "Savings goals", text: "Create goals, add money as you save and watch the progress bar fill." },
  { icon: "shield", title: "Private accounts", text: "Sign up with a username and password. Your data is visible only to you." },
];

const STEPS = [
  { n: 1, title: "Create your account", text: "Sign up with a username and password. Default categories are ready for you." },
  { n: 2, title: "Set your budgets", text: "Choose how much you want to spend on each category this month." },
  { n: 3, title: "Track and improve", text: "Log expenses, react to alerts and reach your savings goals." },
];

// A static, decorative preview of the dashboard.
function Preview() {
  const rows = [
    { name: "Food", pct: 92, tone: "low", text: "₹5,510 / ₹6,000" },
    { name: "Transport", pct: 67, tone: "ok", text: "₹1,680 / ₹2,500" },
    { name: "Entertainment", pct: 100, tone: "exceeded", text: "₹2,149 / ₹2,000" },
    { name: "Bills", pct: 87, tone: "ok", text: "₹3,900 / ₹4,500" },
  ];
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview-bar"><i /><i /><i /></div>
      <div className="preview-body">
        <div className="preview-alert"><Icon name="warning" size={16} /> Entertainment: budget exceeded</div>
        <div className="preview-stats">
          <div><span>Spent</span><strong>₹16,489</strong></div>
          <div><span>Budget</span><strong>₹21,000</strong></div>
          <div><span>Left</span><strong>₹4,511</strong></div>
        </div>
        {rows.map((r) => (
          <div key={r.name} className="preview-row">
            <div className="preview-row-top"><b>{r.name}</b><span>{r.text}</span></div>
            <div className="usage"><div className={`usage-fill ${r.tone}`} style={{ width: `${r.pct}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing({ onLogin, onSignup, onDemo, demoLoading }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand"><Logo size={34} /><span>FinTrack</span></div>
        <nav className="landing-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <div className="landing-actions">
          <button className="ghost" onClick={onLogin}>Sign in</button>
          <button onClick={onSignup}>Get started</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="pill"><Icon name="rupee" size={14} /> Built for everyday money in ₹</span>
          <h1>Know where your money goes. <span className="grad">Spend with confidence.</span></h1>
          <p>
            FinTrack helps you log expenses, set monthly budgets by category, get alerts before you
            overspend and save toward the goals that matter.
          </p>
          <div className="hero-cta">
            <button className="big" onClick={onSignup}>Create free account</button>
            <button className="big secondary" onClick={onDemo} disabled={demoLoading}>
              <Icon name="play" size={16} /> {demoLoading ? "Opening demo..." : "Try the demo"}
            </button>
          </div>
          <p className="small muted">No setup needed. The demo comes with realistic data for this month.</p>
        </div>
        <Preview />
      </section>

      <section id="features" className="section">
        <h2>Everything you need to stay on budget</h2>
        <p className="section-sub">Simple tools that work together, from the first expense to the last rupee saved.</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <div className="feature-icon"><Icon name={f.icon} size={24} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="section alt">
        <h2>Up and running in three steps</h2>
        <div className="steps-row">
          {STEPS.map((s) => (
            <div className="how" key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>Ready to take control?</h2>
        <p>Start with your own account or look around the demo first.</p>
        <div className="hero-cta center">
          <button className="big light" onClick={onSignup}>Create free account</button>
          <button className="big outline" onClick={onDemo} disabled={demoLoading}>Try the demo</button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="brand"><Logo size={26} /><span>FinTrack</span></div>
        <span className="muted">Smart expense and savings management</span>
      </footer>
    </div>
  );
}
