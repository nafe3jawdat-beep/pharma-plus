const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  unverified: "bg-gray-100 text-gray-600",
  rejected: "bg-rose-100 text-rose-700",
  suspended: "bg-rose-100 text-rose-700",
  verified: "bg-emerald-100 text-emerald-700",
  default: "bg-surface-container-high text-on-surface-variant",
};

const STATUS_DOTS = {
  active: "bg-emerald-500",
  approved: "bg-emerald-500",
  pending: "bg-amber-500",
  unverified: "bg-gray-400",
  rejected: "bg-rose-500",
  suspended: "bg-rose-500",
  verified: "bg-emerald-500",
};

export default function StatusBadge({ status, className = "" }) {
  const s = (status || "").toLowerCase();
  const style = STATUS_STYLES[s] || STATUS_STYLES.default;
  const dot = STATUS_DOTS[s] || "bg-gray-400";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${style} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
      {status || "--"}
    </span>
  );
}
