import { Icon } from "../icons.jsx";

// Previous / next controls for a long list. `page` is 0-based.
export function paginate(items, page, size) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages - 1);
  return { slice: items.slice(current * size, current * size + size), pages, current };
}

export default function Pager({ page, pages, total, size, onChange }) {
  if (pages <= 1) return null;
  const from = page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  return (
    <div className="pager">
      <span className="muted small">{from}-{to} of {total}</span>
      <div className="pager-btns">
        <button className="secondary" onClick={() => onChange(page - 1)} disabled={page === 0} aria-label="Previous page">
          <Icon name="chevron-left" size={18} />
        </button>
        <span className="pager-count">{page + 1} / {pages}</span>
        <button className="secondary" onClick={() => onChange(page + 1)} disabled={page >= pages - 1} aria-label="Next page">
          <Icon name="chevron-right" size={18} />
        </button>
      </div>
    </div>
  );
}
