import { useMemo } from "react";
import { fmtMoney, fmtPct } from "./utils";
import { SectionCard, SectionLoading, SectionError, SectionEmpty, DataTable } from "./ui";

export default function StaffTab({
  t, staff, staffError, employees, employeesError, loading,
  isOwner, user, selectedPharmacy, staffSearch, onStaffSearchChange, onRetry,
}) {
  const mergedEmployees = useMemo(() => {
    const byId = new Map(staff.map((p) => [p.pharmacist_id, p]));
    const byName = new Map(staff.map((p) => [(p.name ?? p.pharmacist_name ?? "").toLowerCase(), p]));
    const base = Array.isArray(employees) ? employees : staff.length > 0 ? staff : [];
    const list = base.map((emp) => {
      const perf = byId.get(emp.user_id) || byName.get(String(emp.name ?? "").toLowerCase()) || {};
      return { ...emp, ...perf, role: emp.role || "staff" };
    });
    const hasOwner = list.some((e) => e.role === "owner");
    if (isOwner && !hasOwner) {
      const ownerName = `${user?.f_name ?? ""} ${user?.l_name ?? ""}`.trim() || t("nav.owner");
      list.unshift({
        id: "owner",
        name: ownerName,
        email: user?.email || selectedPharmacy?.support_email || null,
        salary: null,
        role: "owner",
      });
    }
    return list;
  }, [staff, employees, isOwner, user, selectedPharmacy, t]);

  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return mergedEmployees;
    return mergedEmployees.filter((e) => String(e.name ?? "").toLowerCase().includes(q));
  }, [mergedEmployees, staffSearch]);

  const staffRows = filteredStaff.map((p, i) => {
    const isOwnerRow = p.role === "owner";
    const orders = p.total_orders ?? p.total_orders_handled;
    const sales = p.total_sales_volume;
    const avg = p.avg_order_value ?? p.average_order_value;
    const returns = p.total_returns ?? p.returns_count;
    return {
      key: `${p.id ?? p.user_id ?? p.pharmacist_id}-${i}`,
      cells: [
        {
          content: (
            <span className="flex items-center gap-2">
              <span className="font-bold text-on-surface">{p.name ?? p.pharmacist_name}</span>
              {isOwnerRow ? (
                <span className="rounded-md bg-primary-container/40 px-2 py-0.5 text-[10px] font-bold text-primary">{t("nav.owner")}</span>
              ) : (
                <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">{t("nav.employees")}</span>
              )}
            </span>
          ),
        },
        { content: <span className="text-on-surface-variant">{p.email || "—"}</span> },
        { content: <span className="tabular-nums">{p.salary != null && p.salary !== "" ? Number(p.salary).toLocaleString() : "—"}</span>, align: "end" },
        { content: <span className="tabular-nums">{orders != null ? Number(orders).toLocaleString() : "—"}</span>, align: "end" },
        { content: <span className="tabular-nums">{sales != null ? fmtMoney(sales) : "—"}</span>, align: "end" },
        { content: <span className="tabular-nums">{avg != null ? fmtMoney(avg) : "—"}</span>, align: "end" },
        { content: <span className="tabular-nums">{returns != null ? Number(returns).toLocaleString() : "—"}</span>, align: "end" },
        { content: <span className="font-bold tabular-nums text-on-surface">{p.return_rate != null ? fmtPct(p.return_rate) : "—"}</span>, align: "end" },
      ],
    };
  });

  return (
    <SectionCard
      icon="group"
      title={t("Reports.employeeList")}
      subtitle={t("Reports.staffPerformanceSubtitle")}
      actions={
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">search</span>
          <input
            type="text"
            value={staffSearch}
            onChange={(e) => onStaffSearchChange(e.target.value)}
            placeholder={t("Reports.searchEmployeeName")}
            className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest ps-10 pe-3 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary-container/60"
          />
        </div>
      }
    >
      {staffError && !staff.length && employeesError && !employees ? (
        <SectionError onRetry={onRetry} t={t} />
      ) : loading && mergedEmployees.length === 0 ? (
        <SectionLoading t={t} />
      ) : mergedEmployees.length === 0 ? (
        <SectionEmpty icon="group" message={t("employees.noEmployees")} t={t} />
      ) : filteredStaff.length === 0 ? (
        <SectionEmpty icon="search_off" message={t("Reports.noEmployeesMatch")} t={t} />
      ) : (
        <DataTable
          t={t}
          headers={[
            { label: t("employees.name") },
            { label: t("employees.email") },
            { label: t("employees.salary"), align: "end" },
            { label: t("Reports.totalOrders"), align: "end" },
            { label: t("Reports.totalSalesVolume"), align: "end" },
            { label: t("Reports.avgOrderValue"), align: "end" },
            { label: t("Reports.returnsCount"), align: "end" },
            { label: t("Reports.returnRate"), align: "end" },
          ]}
          rows={staffRows}
        />
      )}
    </SectionCard>
  );
}
