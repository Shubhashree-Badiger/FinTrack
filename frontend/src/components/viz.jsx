// Small data-visualisation pieces drawn with plain SVG/CSS: a progress ring and a stacked spend bar.
import { formatINR } from "../format.js";

// Earthy, distinguishable colours for categories.
export const CAT_COLORS = ["#0f5c47", "#e0a526", "#3d7ea6", "#c4553d", "#7b6bb0", "#8a9a5b", "#b0875b", "#5b8c85"];

const toneFor = (pct) => (pct >= 100 ? "var(--bad)" : pct >= 90 ? "var(--low)" : "var(--green)");

// Ring showing how much of a budget is used. Over 100% fills the ring and turns red.
export function Ring({ pct, size = 132, label = "used", center = null }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(pct, 100));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden="true">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--track)" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke={toneFor(pct)} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(shown / 100) * c} ${c}`} transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
      </svg>
      <div className="ring-text">
        {center ?? (<><strong>{Math.round(pct)}%</strong><span>{label}</span></>)}
      </div>
    </div>
  );
}

// One horizontal bar split by category, with a legend underneath.
export function SpendBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;
  return (
    <div>
      <div className="spendbar" role="img" aria-label="Spending by category">
        {segments.map((s) => (
          <span key={s.name} title={`${s.name}: ${formatINR(s.value)}`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.name}>
            <i style={{ background: s.color }} />
            {s.name} <b>{formatINR(s.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
