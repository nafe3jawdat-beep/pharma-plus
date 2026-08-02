export default function StatCard({ icon, label, value, onClick, accent, subtitle }) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 transition-all duration-300 ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg overflow-hidden" : ""
      }`}
    >
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{label}</p>
        </div>
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight tabular-nums">{value ?? "--"}</h2>
          {onClick && (
            <span className="material-symbols-outlined text-on-surface-variant/30 text-lg group-hover:text-primary group-hover:translate-x-0.5 transition-all">
              arrow_forward
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
