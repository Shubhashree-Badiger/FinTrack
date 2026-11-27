// Shows a red banner for exceeded budgets and an amber one for low budgets.
// Alert status is computed by the API; this component only displays it.
export default function AlertBanner({ alerts }) {
  const visible = alerts.filter((a) => a.status === "exceeded" || a.status === "low");
  if (visible.length === 0) return null;

  return (
    <div>
      {visible.map((a) => (
        <div key={`${a.category_id}-${a.month}`} className={`alert ${a.status}`}>
          {a.status === "exceeded"
            ? `${a.category_name}: budget exceeded. Spent ${a.spent} of ${a.budget}.`
            : `${a.category_name}: only ${a.remaining_pct}% of the budget is left (${a.remaining} remaining).`}
        </div>
      ))}
    </div>
  );
}
