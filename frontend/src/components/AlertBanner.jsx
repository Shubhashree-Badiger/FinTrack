import { useState } from "react";
import { Icon } from "../icons.jsx";
import { formatINR } from "../format.js";

// Red banner for exceeded budgets and amber for low budgets. Each one can be dismissed;
// it comes back if the situation changes (the key includes status and amount spent).
// Alert status is computed by the API; this component only displays it.
export default function AlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState(() => new Set());
  const keyOf = (a) => `${a.category_id}-${a.month}-${a.status}-${a.spent}`;
  const visible = alerts.filter(
    (a) => (a.status === "exceeded" || a.status === "low") && !dismissed.has(keyOf(a))
  );
  if (visible.length === 0) return null;
  const dismiss = (keys) => setDismissed((prev) => new Set([...prev, ...keys]));
  return (
    <div className="alerts">
      {visible.map((a) => (
        <div key={keyOf(a)} className={`alert ${a.status}`} role="alert">
          <Icon name={a.status === "exceeded" ? "warning" : "bell"} size={20} />
          <div className="alert-text">
            {a.status === "exceeded" ? (
              <>
                <strong>{a.category_name}: budget exceeded.</strong> You spent {formatINR(a.spent)}{" "}
                of {formatINR(a.budget)}.
              </>
            ) : (
              <>
                <strong>{a.category_name}: almost out.</strong> Only {a.remaining_pct}% of the budget
                is left ({formatINR(a.remaining)} remaining).
              </>
            )}
          </div>
          <button className="icon-btn" aria-label="Dismiss alert" onClick={() => dismiss([keyOf(a)])}>
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
      {visible.length > 1 && (
        <button className="link-btn" onClick={() => dismiss(visible.map(keyOf))}>
          Dismiss all
        </button>
      )}
    </div>
  );
}
