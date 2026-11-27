import { useEffect, useMemo, useState } from "react";
import { formatINR, monthLabel } from "../format.js";
import { Icon } from "../icons.jsx";

const READ_KEY = "fintrack_read_notifications";

function loadRead() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY)) || []);
  } catch {
    return new Set();
  }
}

// Bell with an unread badge. Notifications are the budget alerts (low or exceeded) of the chosen month.
export default function Notifications({ alerts, month, onOpenBudgets }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(loadRead);

  const items = useMemo(
    () =>
      alerts
        .filter((a) => a.status === "exceeded" || a.status === "low")
        .map((a) => ({ ...a, key: `${a.category_id}-${a.month}-${a.status}-${a.spent}` }))
        .sort((x, y) => (x.status === y.status ? 0 : x.status === "exceeded" ? -1 : 1)),
    [alerts]
  );
  const unread = items.filter((i) => !read.has(i.key)).length;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function markAllRead() {
    const next = new Set([...read, ...items.map((i) => i.key)]);
    setRead(next);
    localStorage.setItem(READ_KEY, JSON.stringify([...next].slice(-200)));
  }

  return (
    <div className="notif">
      <button className="icon-btn bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="bell" size={22} />
        {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <>
          <div className="notif-scrim" onClick={() => setOpen(false)} />
          <div className="notif-panel" role="dialog" aria-label="Notifications">
            <div className="notif-head">
              <h2>Notifications</h2>
              {unread > 0 && <button className="link-btn" onClick={markAllRead}>Mark all read</button>}
            </div>
            <p className="muted small notif-sub">Budget alerts for {monthLabel(month)}</p>
            {items.length === 0 ? (
              <div className="notif-empty">
                <Icon name="check" size={26} />
                <strong>You are all caught up</strong>
                <span className="muted small">No budgets are close to their limit.</span>
              </div>
            ) : (
              <ul className="notif-list">
                {items.map((i) => (
                  <li key={i.key} className={`${i.status} ${read.has(i.key) ? "read" : ""}`}>
                    <span className="notif-ico"><Icon name={i.status === "exceeded" ? "warning" : "bell"} size={18} /></span>
                    <div>
                      <strong>
                        {i.category_name} {i.status === "exceeded" ? "is over budget" : "is almost used up"}
                      </strong>
                      <span className="muted small">
                        {i.status === "exceeded"
                          ? `Spent ${formatINR(i.spent)} of ${formatINR(i.budget)}`
                          : `Only ${i.remaining_pct}% left (${formatINR(i.remaining)})`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button className="secondary full" onClick={() => { setOpen(false); onOpenBudgets(); }}>
              Review budgets
            </button>
          </div>
        </>
      )}
    </div>
  );
}
