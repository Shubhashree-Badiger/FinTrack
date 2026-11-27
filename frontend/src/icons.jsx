import { useId } from "react";
// Custom icon set and the FinTrack logo. Every icon is an inline SVG that inherits the text colour.
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const paths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="8" height="10" rx="2" />
      <rect x="13" y="3" width="8" height="6" rx="2" />
      <rect x="13" y="11" width="8" height="10" rx="2" />
      <rect x="3" y="15" width="8" height="6" rx="2" />
    </>
  ),
  expenses: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1H6a2 2 0 0 0-2 2z" />
      <rect x="4" y="8" width="16" height="11" rx="2" />
      <circle cx="16" cy="13.5" r="1.2" />
    </>
  ),
  budgets: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9l6.4 6.4" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  goals: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  edit: (
    <>
      <path d="M4 20h4l11-11-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  warning: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5" />
      <path d="M12 18v.01" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
      <path d="M10 21h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  piggy: (
    <>
      <path d="M5 11a7 6 0 0 1 12.5-3.8L20 6v4l-1 1v3l-2 1v2h-3v-1.5H9V17H6v-2.5A6 6 0 0 1 5 11z" />
      <circle cx="15.5" cy="10.5" r=".7" fill="currentColor" />
    </>
  ),
  rupee: (
    <>
      <path d="M7 5h11M7 9h11" />
      <path d="M10 5c4 0 6 1.5 6 4s-2 4-6 4H7l8 7" />
    </>
  ),
  trend: (
    <>
      <path d="M3 17l6-6 4 4 8-9" />
      <path d="M15 6h6v6" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5z" />,
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M5 20h14" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M14 3v5h5" />
    </>
  ),
  food: (
    <>
      <path d="M7 3v8a2 2 0 0 0 2 2v8" />
      <path d="M5 3v6M9 3v6" />
      <path d="M17 21V3c-2.2 1.2-3.5 4-3.5 7.5 0 1.4.9 2.5 2.2 2.5H17" />
    </>
  ),
  transport: (
    <>
      <rect x="4" y="4" width="16" height="13" rx="3" />
      <path d="M4 11h16" />
      <circle cx="8.5" cy="14" r=".6" fill="currentColor" />
      <circle cx="15.5" cy="14" r=".6" fill="currentColor" />
      <path d="M7 17v3M17 17v3" />
    </>
  ),
  shopping: (
    <>
      <path d="M3 4h2.5l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2" />
      <circle cx="9.5" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </>
  ),
  bills: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 11h7M9 15h7M9 7h3" />
    </>
  ),
  health: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />,
  entertainment: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10 9.5v5l4.5-2.5z" />
    </>
  ),
  other: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),  "chevron-left": <path d="M15 5l-7 7 7 7" />,
  "chevron-right": <path d="M9 5l7 7-7 7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export function Icon({ name, size = 20, className = "" }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      {paths[name]}
    </svg>
  );
}

// FinTrack mark: a flowing "F" ending in a coin dot, with a progress bar. Drawn on a dark tile.
export function Logo({ size = 36 }) {
  const gid = `ft-${useId().replace(/:/g, "")}`; // unique per instance so hidden copies cannot break the gradient
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="FinTrack logo">
      <defs>
        <linearGradient id={gid} x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5cf2c2" />
          <stop offset="1" stopColor="#1c9b78" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="#23263a" />
      <g fill="none" stroke={`url(#${gid})`} strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M62 25H42Q31 25 31 36V61Q31 75 43 75Q51 75 51 68Q51 62 44 62" />
        <path d="M36 53C54 59 71 50 78 32" />
      </g>
      <circle cx="80" cy="27.5" r="5" fill="#5cf2c2" />
      <rect x="57" y="70" width="31" height="9" rx="4.5" fill="none" stroke="#35c99f" strokeWidth="2" />
      <rect x="59.5" y="72.5" width="15" height="4" rx="2" fill="#7df5cf" />
    </svg>
  );
}

// "FinTrack" written like the logo: Fin in the text colour, Track in teal.
export function Wordmark() {
  return (
    <span className="wordmark">
      Fin<b>Track</b>
    </span>
  );
}
// Picks an icon for a category name (custom categories fall back to a generic one).
export function categoryIconName(name = "") {
  const n = name.toLowerCase();
  if (/food|grocer|dining|eat|restaurant/.test(n)) return "food";
  if (/transport|travel|fuel|cab|metro/.test(n)) return "transport";
  if (/shop|cloth|fashion/.test(n)) return "shopping";
  if (/bill|rent|utilit|electric|insurance/.test(n)) return "bills";
  if (/health|medic|pharma|gym/.test(n)) return "health";
  if (/entertain|movie|fun|game|ott/.test(n)) return "entertainment";
  return "other";
}