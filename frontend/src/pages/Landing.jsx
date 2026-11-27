import { Icon, Logo } from "../icons.jsx";
import { CAT_COLORS, Ring, SpendBar } from "../components/viz.jsx";

// ---- Product mock-ups built from the same pieces as the real app ----
function HeroShot() {
  const segments = [
    { name: "Food", value: 5510, color: CAT_COLORS[0] },
    { name: "Bills", value: 3900, color: CAT_COLORS[1] },
    { name: "Shopping", value: 2400, color: CAT_COLORS[2] },
    { name: "Entertainment", value: 2149, color: CAT_COLORS[3] },
  ];
  return (
    <div className="shot" aria-hidden="true">
      <div className="card overview shot-card">
        <div className="overview-main">
          <span className="eyebrow">Spent in November</span>
          <div className="figure">₹16,489</div>
          <p className="muted"><b>₹4,511</b> left of your ₹21,000 budget</p>
        </div>
        <Ring pct={78.5} size={104} />
        <div className="overview-split"><SpendBar segments={segments} /></div>
      </div>
      <div className="snack-mock warn">
        <Icon name="bell" size={18} /> Food: only 8% of the budget is left
      </div>
    </div>
  );
}

function BudgetMock() {
  const rows = [
    ["Food", "₹5,510 of ₹6,000", 92, "low"],
    ["Transport", "₹1,680 of ₹2,500", 67, "ok"],
    ["Entertainment", "₹2,149 of ₹2,000", 100, "exceeded"],
  ];
  return (
    <div className="mock card" aria-hidden="true">
      {rows.map(([name, text, pct, tone]) => (
        <div key={name} className="mock-row">
          <div className="cat-row"><strong>{name}</strong><span className="muted small">{text}</span></div>
          <div className="usage"><div className={`usage-fill ${tone}`} style={{ width: `${pct}%` }} /></div>
        </div>
      ))}
      <div className="alert exceeded"><Icon name="warning" size={18} /><div className="alert-text"><strong>Entertainment: budget exceeded.</strong></div></div>
    </div>
  );
}

function ImportMock() {
  const rows = [["05 Nov", "Swiggy", "Food", "₹450"], ["06 Nov", "Uber", "Transport", "₹212"], ["08 Nov", "Netflix", "Entertainment", "₹649"]];
  return (
    <div className="mock card" aria-hidden="true">
      <div className="file-pill"><Icon name="file" size={18} /> hdfc-november.csv <span className="badge ok">3 rows ready</span></div>
      <table>
        <tbody>
          {rows.map((r) => (
            <tr key={r[1]}><td className="muted">{r[0]}</td><td>{r[1]}</td><td><span className="chip">{r[2]}</span></td><td className="num strong">{r[3]}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="mock-btn"><Icon name="check" size={16} /> Import 3 expenses</div>
    </div>
  );
}

function GoalMock() {
  return (
    <div className="mock card goal-mock" aria-hidden="true">
      <Ring pct={61} size={120} label="saved" />
      <div>
        <h3>Goa trip</h3>
        <p className="muted">₹21,500 of ₹35,000</p>
        <p className="small">Target date 28 Mar</p>
      </div>
    </div>
  );
}

const FAQ = [
  ["Is FinTrack really free?", "Yes. Creating an account and using every feature costs nothing."],
  ["Does it connect to my bank?", "No. Linking a bank account needs regulated access, so instead you import a CSV statement from your bank. Nothing leaves your control and it works with any bank."],
  ["Can I use it on my phone?", "Yes. Open FinTrack in your phone browser and choose Install app (or Add to Home Screen). It then opens full screen like any other app."],
  ["What can I try without signing up?", "Press Try the demo. It opens a sample account with realistic data for the current month."],
  ["How do the alerts work?", "Set a monthly budget for a category. You get an amber warning when 10% or less is left and a red one when you go over."],
];

export default function Landing({ onLogin, onSignup, onDemo, demoLoading, install }) {
  const canInstall = install && !install.installed && (install.canPrompt || install.iosHint);
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand"><Logo size={32} /><span>FinTrack</span></div>
        <nav className="landing-links">
          <a href="#features">Features</a>
          <a href="#import">Import</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="landing-actions">
          {canInstall && (
            <button className="ghost hide-sm" onClick={() => (install.canPrompt ? install.install() : window.alert("Tap Share, then 'Add to Home Screen'."))}>
              <Icon name="download" size={18} /> Install
            </button>
          )}
          <button className="ghost" onClick={onLogin}>Sign in</button>
          <button onClick={onSignup}>Get started</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-text">
          <p className="kicker">Expense and savings tracker for India</p>
          <h1>See where your rupees actually went.</h1>
          <p className="lede">
            Log what you spend, give every category a monthly budget, and get a warning before you
            overshoot, not after. Bring in your bank statement in one upload.
          </p>
          <div className="hero-cta">
            <button className="big" onClick={onSignup}>Create free account</button>
            <button className="big secondary" onClick={onDemo} disabled={demoLoading}>
              {demoLoading ? "Opening demo..." : "Try the demo"}
            </button>
          </div>
          <p className="small muted">Free. No card. Installs on your phone like an app.</p>
        </div>
        <HeroShot />
      </section>

      <section className="facts">
        <div><strong>₹</strong><span>Every amount in rupees</span></div>
        <div><strong>10%</strong><span>Warning when this much budget is left</span></div>
        <div><strong>CSV</strong><span>Import any bank statement</span></div>
        <div><strong>1 tap</strong><span>Add to your home screen</span></div>
      </section>

      <section id="features" className="band">
        <div className="split">
          <div>
            <p className="kicker">Budgets</p>
            <h2>A limit for every category, every month</h2>
            <p>
              Food can be ₹6,000 in November and ₹5,000 in December. Each budget has its own bar, so a
              glance tells you which category needs attention.
            </p>
            <ul className="ticks">
              <li><Icon name="check" size={18} /> Amber warning at 10% left</li>
              <li><Icon name="check" size={18} /> Red alert the moment you go over</li>
              <li><Icon name="check" size={18} /> Dismiss alerts you have seen</li>
            </ul>
          </div>
          <BudgetMock />
        </div>
      </section>

      <section id="import" className="band alt">
        <div className="split flip">
          <ImportMock />
          <div>
            <p className="kicker">Import</p>
            <h2>Stop typing. Upload your statement.</h2>
            <p>
              Download our template or use your bank's CSV export as it is. We read dates and rupee
              amounts in common formats, guess categories from names like Swiggy or Uber, and skip anything
              already imported.
            </p>
            <ul className="ticks">
              <li><Icon name="check" size={18} /> Review every row before it is saved</li>
              <li><Icon name="check" size={18} /> Duplicates are skipped automatically</li>
              <li><Icon name="check" size={18} /> Works with any bank that exports CSV</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="split">
          <div>
            <p className="kicker">Goals and reports</p>
            <h2>Know the month, and save for what is next</h2>
            <p>
              A monthly report compares spending with budget for each category, with a chart. Savings
              goals show how far you are from the trip, the laptop or the emergency fund.
            </p>
          </div>
          <GoalMock />
        </div>
      </section>

      <section className="demo-band">
        <h2>Want to look around first?</h2>
        <p>The demo account has a full month of sample spending, alerts and goals.</p>
        <button className="big light" onClick={onDemo} disabled={demoLoading}>{demoLoading ? "Opening demo..." : "Open the demo"}</button>
      </section>

      <section id="faq" className="band narrow">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="faq">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <footer className="landing-footer">
        <div className="brand"><Logo size={26} /><span>FinTrack</span></div>
        <span className="muted small">Made by Shubhashree B Badiger</span>
      </footer>
    </div>
  );
}
