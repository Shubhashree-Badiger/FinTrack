// Thin wrapper around the FinTrack REST API. The UI only displays what the API returns.
// Empty in the combined Docker image (same origin); points at the local API during `npm run dev`.
const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8000" : "");
export const API_BASE = BASE_URL;
const TOKEN_KEY = "fintrack_token";
const USER_KEY = "fintrack_user";

// Login session kept in localStorage so a page refresh keeps the user signed in.
export const session = {
  token: () => localStorage.getItem(TOKEN_KEY),
  user: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  save({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  // Called when the API says the token is no longer valid (expired or removed).
  onExpired: () => {},
};

// Turn FastAPI error bodies (string or validation list) into a readable message.
function errorMessage(body, status) {
  if (body && typeof body.detail === "string") return body.detail;
  if (body && Array.isArray(body.detail)) {
    return body.detail
      .map((d) => `${d.loc.slice(1).join(".")}: ${d.msg}`)
      .join("; ");
  }
  return `Request failed (${status})`;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = session.token();
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers, ...options });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (response.status === 401 && token && !path.startsWith("/auth/")) {
    session.clear();
    session.onExpired();
  }
  if (!response.ok) throw new Error(errorMessage(body, response.status));
  return body;
}

const send = (method, path, data) =>
  request(path, { method, body: JSON.stringify(data) });

export const api = {
  register: (data) => send("POST", "/auth/register", data),
  login: (data) => send("POST", "/auth/login", data),
  demoLogin: () => send("POST", "/auth/demo", {}),
  templateUrl: `${BASE_URL}/import/template`,
  importExpenses: (csv, dryRun) => send("POST", `/import/expenses?dry_run=${dryRun}`, { csv }),
  getCategories: () => request("/categories"),
  createCategory: (data) => send("POST", "/categories", data),
  getExpenses: (month, categoryId) =>
    request(`/expenses?month=${month}${categoryId ? `&category_id=${categoryId}` : ""}`),
  createExpense: (data) => send("POST", "/expenses", data),
  updateExpense: (id, data) => send("PUT", `/expenses/${id}`, data),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: "DELETE" }),
  getBudgets: (month) => request(`/budgets?month=${month}`),
  saveBudget: (data) => send("PUT", "/budgets", data),
  getAlerts: (month) => request(`/alerts?month=${month}`),
  getMonthlyTotal: (month) => request(`/reports/monthly-total?month=${month}`),
  getBudgetVsSpend: (month) => request(`/reports/budget-vs-spend?month=${month}`),
  getGoals: () => request("/goals"),
  createGoal: (data) => send("POST", "/goals", data),
  contribute: (id, amount) => send("PATCH", `/goals/${id}/contribute`, { amount }),
};
