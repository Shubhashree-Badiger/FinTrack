// Small shared building blocks: loading, empty and error states, badges and progress bars.
import { Icon } from "../icons.jsx";
import { STATUS_LABEL } from "../format.js";

export function Loading({ text = "Loading..." }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      {text}
    </div>
  );
}

export function Empty({ icon = "trend", title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorNote({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="note error" role="alert">
      <Icon name="warning" size={18} />
      <span>{message}</span>
      {onClose && (
        <button className="icon-btn" onClick={onClose} aria-label="Dismiss message">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}

// Progress bar: spent against budget. Never divides by zero; over 100% is capped visually.
export function UsageBar({ spent, budget, status }) {
  const b = Number(budget);
  const pct = b > 0 ? Math.min((Number(spent) / b) * 100, 100) : 0;
  return (
    <div className="usage" aria-hidden="true">
      <div className={`usage-fill ${status}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
