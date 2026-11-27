import { useState } from "react";
import { api } from "../api.js";
import { Icon, Logo } from "../icons.jsx";
import { ErrorNote } from "../components/ui.jsx";

// Sign in / create account screen. `mode` is "login" or "signup".
export default function AuthPage({ mode, setMode, onAuthed, onDemo, demoLoading, onBack }) {
  const signup = mode === "signup";
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = signup
        ? await api.register({ name, username, password })
        : await api.login({ username, password });
      onAuthed(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <div className="brand light"><Logo size={38} /><span>FinTrack</span></div>
        <h2>Your money, finally clear.</h2>
        <ul>
          <li><Icon name="check" size={18} /> Budgets for every category and month</li>
          <li><Icon name="check" size={18} /> Alerts before you overspend</li>
          <li><Icon name="check" size={18} /> Reports and charts in rupees</li>
          <li><Icon name="check" size={18} /> Savings goals with progress</li>
        </ul>
      </aside>

      <main className="auth-card">
        <button className="link-btn back" onClick={onBack}>&larr; Back to home</button>
        <h1>{signup ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">
          {signup ? "It takes less than a minute." : "Sign in to see your budgets and expenses."}
        </p>

        <ErrorNote message={error} />

        <form className="stack" onSubmit={submit}>
          {signup && (
            <label>
              Your name
              <input type="text" required maxLength={100} autoComplete="name" placeholder="e.g. Asha Rao"
                value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label>
            Username
            <input type="text" required minLength={signup ? 3 : 1} maxLength={30} autoComplete="username"
              pattern={signup ? "[A-Za-z0-9_.]+" : undefined}
              title={signup ? "Letters, numbers, dots and underscores only" : undefined}
              placeholder="e.g. asha_rao" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password
            <div className="password">
              <input type={show ? "text" : "password"} required minLength={signup ? 6 : 1} maxLength={100}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "At least 6 characters" : "Your password"}
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="link-btn" onClick={() => setShow(!show)}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          <button type="submit" className="big" disabled={busy}>
            {busy ? "Please wait..." : signup ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="divider"><span>or</span></div>
        <button className="big secondary full" onClick={onDemo} disabled={demoLoading}>
          <Icon name="play" size={16} /> {demoLoading ? "Opening demo..." : "Sign in with the demo account"}
        </button>

        <p className="switch">
          {signup ? "Already have an account?" : "New to FinTrack?"}{" "}
          <button className="link-btn" onClick={() => setMode(signup ? "login" : "signup")}>
            {signup ? "Sign in" : "Create an account"}
          </button>
        </p>
      </main>
    </div>
  );
}
