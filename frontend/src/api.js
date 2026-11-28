// Small wrapper around the FinTrack API. Stores the login token in localStorage.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getToken = () => localStorage.getItem("token");
export const getName = () => localStorage.getItem("name");

export function saveLogin({ access_token, name }) {
  localStorage.setItem("token", access_token);
  localStorage.setItem("name", name);
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("name");
}

// Turn FastAPI error bodies into a readable message.
function errorMessage(body, status) {
  if (body && typeof body.detail === "string") return body.detail;
  if (body && Array.isArray(body.detail)) {
    return body.detail.map((d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join("; ");
  }
  return `Request failed (${status})`;
}

async function request(method, path, data) {
  const headers = { "Content-Type": "application/json" };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${BASE_URL}. Is it running?`);
  }

  // Expired or invalid token: log out so the login page is shown.
  if (response.status === 401 && getToken()) {
    logout();
    window.location.reload();
  }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(body, response.status));
  return body;
}

export const api = {
  register: (data) => request("POST", "/auth/register", data),
  login: (data) => request("POST", "/auth/login", data),

  getCategories: () => request("GET", "/categories"),
  createCategory: (name) => request("POST", "/categories", { name }),

  getExpenses: (month) => request("GET", `/expenses?month=${month}`),
  createExpense: (data) => request("POST", "/expenses", data),
  updateExpense: (id, data) => request("PUT", `/expenses/${id}`, data),
  deleteExpense: (id) => request("DELETE", `/expenses/${id}`),

  getBudgets: (month) => request("GET", `/budgets?month=${month}`),
  setBudget: (data) => request("PUT", "/budgets", data),

  getSummary: (month) => request("GET", `/reports/summary?month=${month}`),
};
