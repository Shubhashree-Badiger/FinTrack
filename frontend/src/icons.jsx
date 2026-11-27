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
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export function Icon({ name, size = 20, className = "" }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      {paths[name]}
    </svg>
  );
}

// FinTrack mark: a rounded tile with a rising line that ends in a coin.
export function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="FinTrack logo">
      <defs>
        <linearGradient id="ft-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14b88a" />
          <stop offset="1" stopColor="#3b5bdb" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#ft-g)" />
      <path
        d="M9 33l9-9 7 6 9-11"
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="16" r="6" fill="#ffd166" />
      <path d="M32.6 14.2h4.8M32.6 16.4h4.8M33.4 14.2c2.4 0 3 .9 3 1.8s-.9 1.8-3 1.8l2.6 2.4" fill="none" stroke="#7a5200" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
