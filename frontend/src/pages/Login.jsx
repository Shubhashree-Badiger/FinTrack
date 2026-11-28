import { useState } from "react";
import { api, saveLogin } from "../api.js";

export default function Login({ onDone, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      saveLogin(await api.login({ email, password }));
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth">
      <form className="card" onSubmit={submit}>
        <h1>FinTrack</h1>
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button type="submit">Login</button>
        <p>No account? <a href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>Register</a></p>
      </form>
    </div>
  );
}
