const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const PRESETS = [7, 30, 90];
const TOP_MEDS_LIMITS = [5, 10];

const TABS = [
  { key: "overview", labelKey: "Reports.tabOverview", icon: "monitoring" },
  { key: "medications", labelKey: "Reports.tabMedications", icon: "pill" },
  { key: "inventory", labelKey: "Reports.tabInventory", icon: "inventory_2" },
  { key: "staff", labelKey: "Reports.tabStaff", icon: "group" },
  { key: "ai", labelKey: "Reports.tabAiInsights", icon: "auto_awesome" },
];

const fmtMoney = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (v) => (v == null ? "-" : `${(Number(v) * 100).toFixed(1)}%`);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString() : "-";

const EXPENSE_COLORS = [
  "var(--color-primary)",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#10b981",
  "#ef4444",
  "#06b6d4",
];

const selectCls =
  "w-full rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-container/60";

const labelCls =
  "text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant ms-1";

export {
  toDateStr,
  PRESETS,
  TOP_MEDS_LIMITS,
  TABS,
  fmtMoney,
  fmtPct,
  fmtDate,
  EXPENSE_COLORS,
  selectCls,
  labelCls,
};
