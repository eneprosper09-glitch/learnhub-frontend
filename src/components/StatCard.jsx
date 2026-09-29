export default function StatCard({ label, value, icon, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700',
    purple: 'bg-purple-50 text-purple-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-5 flex items-center gap-4 shadow-card hover:shadow-soft transition">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
          colors[color] || colors.brand
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-ink-900">{value}</div>
        <div className="text-sm text-ink-500">{label}</div>
      </div>
    </div>
  );
}