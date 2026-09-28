export default function Spinner({ full = false, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  const el = (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600`}
    />
  );
  if (!full) return el;
  return <div className="min-h-screen flex items-center justify-center">{el}</div>;
}