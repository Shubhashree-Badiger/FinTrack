import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import AlertBanner from "../components/AlertBanner.jsx";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";

// Default date for the form: today if it falls in the selected month, else the 1st of it.
function defaultDate(month) {
  const today = new Date().toISOString().slice(0, 10);
  return today.startsWith(month) ? today : `${month}-01`;
}

export default function Expenses({ month }) {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [cats, exps] = await Promise.all([api.getCategories(), api.getExpenses(month)]);
      setCategories(cats);
      setExpenses(exps);
    } catch (e) {
      setError(e.message);
    }
  }, [month]);

  useEffect(() => {
    setAlert(null);
    setEditing(null);
    load();
  }, [load]);

  // Save a new or edited expense and show the alert returned by the API.
  async function save(payload) {
    setError("");
    try {
      const saved = editing
        ? await api.updateExpense(editing.id, payload)
        : await api.createExpense(payload);
      setAlert(saved.alert);
      setEditing(null);
      await load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  async function remove(id) {
    setError("");
    try {
      await api.deleteExpense(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      {alert && <AlertBanner alerts={[alert]} />}
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h2>{editing ? "Edit expense" : "Add expense"}</h2>
        <ExpenseForm
          key={editing ? editing.id : "new"}
          categories={categories}
          initial={editing}
          defaultDate={defaultDate(month)}
          onSubmit={save}
          onCancel={editing ? () => setEditing(null) : null}
        />
      </div>
      <div className="card">
        <h2>Expenses for {month}</h2>
        <ExpenseList
          expenses={expenses}
          categories={categories}
          onEdit={setEditing}
          onDelete={remove}
        />
      </div>
    </div>
  );
}
