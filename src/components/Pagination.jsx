export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const nums = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
      <span className="text-sm text-ink-500">
        Page {page} of {pages}
      </span>
      <div className="flex gap-1">
        <button
          className="px-3 py-1.5 rounded-lg text-sm bg-white border border-ink-200 text-ink-700 font-medium hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </button>
        {nums.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              n === page
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          className="px-3 py-1.5 rounded-lg text-sm bg-white border border-ink-200 text-ink-700 font-medium hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}