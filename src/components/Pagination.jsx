export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const nums = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
      <span className="text-sm text-slate-500">
        Page {page} of {pages}
      </span>
      <div className="flex gap-1">
        <button
          className="px-3 py-1.5 rounded-lg text-sm bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </button>
        {nums.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              n === page
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-300 hover:bg-slate-50'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          className="px-3 py-1.5 rounded-lg text-sm bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}