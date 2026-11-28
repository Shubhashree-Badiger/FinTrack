import { useState } from "react";
import { api, saveLogin } from "../api.js";

export default function Register({ onDone, onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      saveLogin(await api.register({ name, email, password }));
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth">
      <form className="card" onSubmit={submit}>
        <h1>FinTrack</h1>
        <h2>Create account</h2>
        {error && <p className="error">{error}</p>}
        <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password (min 6 characters)<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button type="submit">Register</button>
        <p>Already registered? <a href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>Login</a></p>
      </form>
    </div>
  );
}
