import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { reportsApi, employeeService } from "../../services/pharmacist";
import { useAuth } from "../../contexts/AuthContext";
import { toDateStr, PRESETS, TABS, fmtDate, selectCls, labelCls } from "./utils";
import { KpiStrip } from "./ui";
import OverviewTab from "./OverviewTab";
import MedicationsTab from "./MedicationsTab";
import InventoryTab from "./InventoryTab";
import StaffTab from "./StaffTab";
import AiBlock from "./AiBlock";

export default function FinancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedPharmacy, isOwner } = useOutletContext();
  const pharmacyId = selectedPharmacy?.id;

  const today = new Date();
  const initStart = toDateStr(new Date(today.getTime() - 29 * 86400000));
  const initEnd = toDateStr(today);

  const [activeTab, setActiveTab] = useState("overview");
  const [startDate, setStartDate] = useState(initStart);
  const [endDate, setEndDate] = useState(initEnd);
  const [preset, setPreset] = useState(30);
  const [filters, setFilters] = useState({
    start_date: `${initStart}T00:00:00Z`,
    end_date: `${initEnd}T23:59:59Z`,
    days: 30,
    topMedsLimit: 5,
  });
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const [topMeds, setTopMeds] = useState(null);
  const [topMedsLoading, setTopMedsLoading] = useState(false);
  const [topMedsError, setTopMedsError] = useState(false);

  const [ai, setAi] = useState({ status: "idle", data: null, loading: false });
  const [staffSearch, setStaffSearch] = useState("");

  const fetchAll = useCallback(async () => {
    if (!pharmacyId) return;
    setLoading(true);
    const requests = [
      ["summary", reportsApi.financialSummary(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["demand", reportsApi.demand(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["expiring", reportsApi.expiringInventory(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date, days: filters.days })],
      ["slowMoving", reportsApi.slowMoving(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["staff", reportsApi.staffPerformance(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["employees", employeeService.getAll(pharmacyId)],
    ];
    const results = await Promise.allSettled(requests.map(([, p]) => p));
    const nextData = {};
    const nextErrors = {};
    results.forEach((r, i) => {
      const key = requests[i][0];
      if (r.status === "fulfilled") {
        nextData[key] = r.value?.data ?? null;
        nextErrors[key] = false;
      } else {
        nextData[key] = null;
        nextErrors[key] = true;
      }
    });
    setData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  }, [pharmacyId, filters]);

  const loadTopMeds = useCallback(async (limit = filters.topMedsLimit) => {
    if (!pharmacyId) return;
    setTopMedsLoading(true);
    setTopMedsError(false);
    try {
      const res = await reportsApi.topMedications(pharmacyId, {
        start_date: filters.start_date,
        end_date: filters.end_date,
        limit,
      });
      setTopMeds(res?.data ?? []);
    } catch {
      setTopMeds([]);
      setTopMedsError(true);
    } finally {
      setTopMedsLoading(false);
    }
  }, [pharmacyId, filters.start_date, filters.end_date, filters.topMedsLimit]);

  const fetchAiReport = useCallback(async () => {
    if (!pharmacyId) return;
    setAi((p) => ({ ...p, loading: true }));
    try {
      const res = await reportsApi.aiInsights(pharmacyId);
      const report = res?.data ?? null;
      if (report?.status === "completed") {
        setAi({ status: "ready", data: report, loading: false });
      } else if (report) {
        setAi({ status: "pending", data: report, loading: false });
      } else {
        setAi({ status: "idle", data: null, loading: false });
      }
    } catch {
      setAi({ status: "error", data: null, loading: false });
    }
  }, [pharmacyId]);

  const generateAiReport = useCallback(async () => {
    if (!pharmacyId) return;
    setAi({ status: "loading", data: null, loading: true });
    try {
      await reportsApi.generateAiInsights(pharmacyId, {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    } catch {
      setAi({ status: "error", data: null, loading: false });
      return;
    }
    await fetchAiReport();
  }, [pharmacyId, filters.start_date, filters.end_date, fetchAiReport]);

  useEffect(() => { fetchAll(); /* eslint-disable-line react-hooks/set-state-in-effect */ }, [fetchAll]);

  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 86400000);
    const s = toDateStr(start);
    const e = toDateStr(end);
    setStartDate(s);
    setEndDate(e);
    setPreset(days);
    setTopMeds(null);
    setAi({ status: "idle", data: null, loading: false });
    setFilters((f) => ({ ...f, start_date: `${s}T00:00:00Z`, end_date: `${e}T23:59:59Z` }));
  };

  const applyRange = (start, end) => {
    setTopMeds(null);
    setAi({ status: "idle", data: null, loading: false });
    setFilters((f) => ({ ...f, start_date: `${start}T00:00:00Z`, end_date: `${end}T23:59:59Z` }));
  };

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const summary = data.summary;
  const summaryError = errors.summary;
  const demand = data.demand ?? [];
  const demandError = errors.demand;
  const expiring = data.expiring;
  const expiringError = errors.expiring;
  const slowMoving = data.slowMoving ?? [];
  const slowMovingError = errors.slowMoving;
  const staff = useMemo(() => data.staff ?? [], [data.staff]);
  const staffError = errors.staff;
  const employees = data.employees ?? null;
  const employeesError = errors.employees;

  const insights = ai.data?.ai_insights ?? {};

  return (
    <main className="relative h-full overflow-y-auto bg-surface p-4 sm:p-6 md:p-8">
      <div className="pointer-events-none absolute top-0 right-0 h-[460px] w-[460px] rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-secondary-container/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dim shadow-md shadow-primary/15">
              <span className="material-symbols-outlined text-on-primary text-2xl">savings</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">{t("Reports.title")}</h1>
              <p className="mt-0.5 text-sm text-on-surface-variant">{t("Reports.subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedPharmacy && (
              <span className="inline-flex items-center gap-2 rounded-full border border-surface-container-high bg-surface-container-lowest px-3.5 py-1.5 text-sm font-bold text-on-surface shadow-ambient-sm">
                <span className="material-symbols-outlined text-base text-primary">store</span>
                <span className="max-w-44 truncate">{selectedPharmacy.name}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border border-surface-container-high bg-surface-container-lowest px-3.5 py-1.5 text-xs font-bold text-on-surface-variant shadow-ambient-sm">
              <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
              {fmtDate(startDate)} — {fmtDate(endDate)}
            </span>
          </div>
        </header>

        <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 shadow-ambient-sm sm:p-5">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="flex flex-col gap-2">
              <span className={labelCls}>{t("Reports.period")}</span>
              <div className="flex gap-1 rounded-xl bg-surface-container/70 p-1">
                {PRESETS.map((d) => (
                  <button
                    key={d}
                    onClick={() => applyPreset(d)}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-all ${preset === d ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                  >
                    {t(`Reports.last${d}Days`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={labelCls}>{t("Reports.startDate")}</span>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">calendar_today</span>
                <input type="date" value={startDate} onChange={(e) => { const v = e.target.value; setStartDate(v); setPreset(null); if (v && endDate) applyRange(v, endDate); }} className={`${selectCls} ps-10`} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={labelCls}>{t("Reports.endDate")}</span>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">calendar_today</span>
                <input type="date" value={endDate} onChange={(e) => { const v = e.target.value; setEndDate(v); setPreset(null); if (v && startDate) applyRange(startDate, v); }} className={`${selectCls} ps-10`} />
              </div>
            </div>
          </div>
        </div>

        <KpiStrip t={t} summary={summary} loading={loading} error={summaryError} onRetry={() => fetchAll()} />

        <div className="flex w-fit max-w-full flex-wrap gap-1.5 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-1.5 shadow-ambient-sm">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  active
                    ? "bg-gradient-to-r from-primary to-primary-dim text-on-primary shadow-md"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        <div key={activeTab} className="animate-fade-in space-y-6">
          {activeTab === "overview" && (
            <OverviewTab t={t} summary={summary} summaryError={summaryError} loading={loading} onRetry={() => fetchAll()} />
          )}

          {activeTab === "medications" && (
            <MedicationsTab
              t={t}
              topMeds={topMeds}
              topMedsLoading={topMedsLoading}
              topMedsError={topMedsError}
              demand={demand}
              demandError={demandError}
              loading={loading}
              filters={filters}
              onLoadTopMeds={loadTopMeds}
              onSetFilter={setFilter}
              onResetTopMeds={() => setTopMeds(null)}
              onRetry={() => fetchAll()}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryTab
              t={t}
              expiring={expiring}
              expiringError={expiringError}
              slowMoving={slowMoving}
              slowMovingError={slowMovingError}
              loading={loading}
              filters={filters}
              onSetFilter={setFilter}
              onRetry={() => fetchAll()}
            />
          )}

          {activeTab === "staff" && (
            <StaffTab
              t={t}
              staff={staff}
              staffError={staffError}
              employees={employees}
              employeesError={employeesError}
              loading={loading}
              isOwner={isOwner}
              user={user}
              selectedPharmacy={selectedPharmacy}
              staffSearch={staffSearch}
              onStaffSearchChange={setStaffSearch}
              onRetry={() => fetchAll()}
            />
          )}

          {activeTab === "ai" && (
            <AiBlock t={t} ai={ai} insights={insights} onGenerate={generateAiReport} onRefresh={fetchAiReport} />
          )}
        </div>
      </div>
    </main>
  );
}
