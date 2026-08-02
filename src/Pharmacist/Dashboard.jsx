import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useNotificationCount } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '../services/pharmacist';
import { operatingHourService } from '../services/pharmacist';
import { employeeService } from '../services/pharmacist';
import { cacheDashboard, getCachedDashboard } from '../services/pharmacist';
import { NetworkIndicator } from '../components/NetworkIndicator';

function StatCard({ icon, label, value, onClick, accent, gradient }) {
  return (
    <div
      onClick={onClick}
      className="relative group overflow-hidden rounded-2xl bg-surface-container-lowest border border-surface-container-high p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center shadow-sm`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">{label}</p>
        </div>
        <div className="flex items-end gap-1.5">
          <h2 className="text-4xl font-bold text-on-surface tracking-tight tabular-nums">{value ?? "--"}</h2>
        </div>
      </div>
      {onClick && (
        <span className="material-symbols-outlined absolute top-4 right-4 text-outline-variant/40 text-lg group-hover:translate-x-0.5 transition-transform">
          arrow_forward
        </span>
      )}
    </div>
  );
}

function InventoryProgressBar({ stock, max, t }) {
  const stockVal = stock.stock || 0;
  const pct = Math.min((stockVal / max) * 100, 100);
  const isLow = stockVal <= 20;
  const isMedium = stockVal <= 50;
  const color = isLow ? 'bg-red-400' : isMedium ? 'bg-amber-400' : 'bg-emerald-400';
  const bgColor = isLow ? 'bg-red-50' : isMedium ? 'bg-amber-50' : 'bg-emerald-50';
  const iconColor = isLow ? 'text-red-500' : isMedium ? 'text-amber-500' : 'text-emerald-500';
  const icon = isLow ? 'warning' : isMedium ? 'schedule' : 'check_circle';
  const barBg = isLow ? 'bg-red-100' : isMedium ? 'bg-amber-100' : 'bg-emerald-100';

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-surface transition-all cursor-pointer group">
      <div className={`w-1 h-12 rounded-full flex-shrink-0 ${color}`} />
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-on-surface truncate">{stock.name || stock.medication?.trade_name || "Unknown"}</p>
        <p className="text-xs text-on-surface-variant/70 mt-0.5">{stock.supplier || stock.medication?.trade_name || ""}</p>
        <div className={`mt-2 w-full h-2 ${barBg} rounded-full overflow-hidden`}>
          <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-end flex-shrink-0">
        <p className={`text-lg font-bold tabular-nums ${isLow ? 'text-red-500' : isMedium ? 'text-amber-600' : 'text-emerald-600'}`}>
          {stock.stock}
        </p>
        <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wide">{t("dashboard.left")}</p>
      </div>
    </div>
  );
}

function SkeletonBar({ className }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-lg ${className}`} />;
}

export default function DashboardContent() {
  const { unreadCount } = useNotificationCount();
  const { theme, toggleTheme } = useTheme();
  const { selectedPharmacy, myPermissions, isOwner, loaded, canCreatePharmacy } = useOutletContext();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [operatingHours, setOperatingHours] = useState([]);
  const [employeeAvatars, setEmployeeAvatars] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const user =localStorage.getItem("user")?JSON.parse(localStorage.getItem("user")):null;
  useEffect(() => {
    if (!selectedPharmacy?.id) return;
    setLoading(true);
    
    const pharmacyId = selectedPharmacy.id;

    dashboardApi.getPharmacyDetail(pharmacyId)
      .then((response) => {
        const pharmacyData = response.data || response;
        setStats(pharmacyData);
        setInventoryAlerts(pharmacyData?.inventoryAlerts ?? pharmacyData?.alerts ?? []);
        setEmployeeAvatars(pharmacyData?.employeeAvatars ?? []);
        cacheDashboard(pharmacyId, pharmacyData).catch(() => {});
      })
      .catch(async () => {
        const cached = await getCachedDashboard(pharmacyId);
        if (cached) {
          setStats(cached);
          setInventoryAlerts(cached?.inventoryAlerts ?? cached?.alerts ?? []);
          setEmployeeAvatars(cached?.employeeAvatars ?? []);
        }
      });
    employeeService.getAll(pharmacyId)
      .then((res) => {
        const employeeList = res?.data ?? [];
        setEmployees(employeeList);
        if (employeeList.length > 0) {
          setStats((prev) => prev ? { ...prev, staff_count: employeeList.length } : prev);
        }
      })
      .catch(() => {});
    operatingHourService.get(pharmacyId)
      .then((res) => setOperatingHours(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedPharmacy?.id]);

  if (!selectedPharmacy && loaded) {
    const h = new Date().getHours();
    const greeting = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
    return (
      <main className="h-full overflow-y-auto bg-surface relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 p-4 sm:p-6 md:p-10 max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  {t("dashboard.title")}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{greeting}</h1>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                to="/Dashboard/Notifications"
                className="relative p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-xl text-on-surface-variant">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-surface" />
                )}
              </Link>
            </div>
          </header>

          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container/30 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-primary">local_pharmacy</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">{t("dashboard.joinPharmacy")}</h2>
            <p className="text-sm text-on-surface-variant/70 mb-8 max-w-md">
              {t("dashboard.joinPharmacyDesc")}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate('/Dashboard/FindPharmacy')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">search</span>
                {t("nav.findPharmacy")}
              </button>
              {canCreatePharmacy && (
                <button
                  onClick={() => navigate('/Dashboard/AddPharmacy')}
                  className="px-6 py-3 rounded-xl bg-secondary-container text-on-secondary-container font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 border border-surface-container-high"
                >
                  <span className="material-symbols-outlined text-lg">add_business</span>
                  {t("nav.createPharmacy")}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();
  return (
    <main className="h-full overflow-y-auto bg-surface relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4 sm:p-6 md:p-10 max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">
                {selectedPharmacy?.name || t("dashboard.title")}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
              {greeting} {user.f_name }
            </h1>
            <p className="text-sm text-on-surface-variant/70 mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <NetworkIndicator />
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-xl text-on-surface-variant">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <Link
              to="/Dashboard/Notifications"
              className="relative p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-xl text-on-surface-variant">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-surface" />
              )}
            </Link>

            {(isOwner || myPermissions?.pharmacy_manage) && (
            <button
              onClick={() => navigate('/Dashboard/AnalyticsPage')}
              className="px-4 py-2.5 rounded-xl bg-secondary-container text-on-secondary-container font-bold text-sm flex items-center gap-2 hover:bg-secondary-container/80 transition-all border border-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
              {t("dashboard.analysis")}
            </button>
            )}

            <button
              onClick={() => navigate('/Dashboard/AddDrugPage')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">pill</span>
              {t("dashboard.addMeds")}
            </button>
          </div>
        </header>

        {loading && !stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-6">
                <SkeletonBar className="w-10 h-10 mb-4" />
                <SkeletonBar className="w-24 h-3 mb-2" />
                <SkeletonBar className="w-20 h-8" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <StatCard
              icon="inventory_2"
              label={t("dashboard.inventoryItems")}
              value={stats?.total_stock}
              onClick={isOwner || myPermissions?.inventory_manage ? () => navigate('/Dashboard/StockManagement') : undefined}
              accent="bg-primary-container/30 text-primary"
              gradient="bg-gradient-to-br from-primary/[0.04] to-transparent"
            />
            <StatCard
              icon="receipt_long"
              label={t("dashboard.pendingOrders")}
              value={stats?.pending_orders_count}
              onClick={isOwner || myPermissions?.orders_process ? () => navigate('/Dashboard/Requests') : undefined}
              accent="bg-secondary-container/30 text-on-secondary-container"
              gradient="bg-gradient-to-br from-secondary/[0.04] to-transparent"
            />
            <StatCard
              icon="star"
              label={t("dashboard.averageRating")}
              value={stats?.average_rating}
              accent="bg-amber-100 text-amber-600"
              gradient="bg-gradient-to-br from-amber-50 to-transparent"
            />
          </div>
        )}

        {selectedPharmacy && (
        <div
          onClick={() => navigate('/Dashboard/Employees')}
          className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-5 sm:p-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 mb-8 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant font-medium">{t("dashboard.teamMembers")}</p>
                <div className="flex items-end gap-1.5">
                  <h2 className="text-3xl font-bold text-on-surface tracking-tight tabular-nums">{stats?.staff_count ?? "--"}</h2>
                  <span className="text-xs text-on-surface-variant/60 mb-1">{t("nav.employees")}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {employeeAvatars.length > 0 && (
                <div className="flex -space-x-2">
                  {employeeAvatars.slice(0, 3).map((initials, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dim text-on-primary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-container-lowest shadow-sm"
                    >
                      {initials}
                    </div>
                  ))}
                  {stats?.staff_count > 3 && (
                    <div className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-container-lowest">
                      +{stats.staff_count - 3}
                    </div>
                  )}
                </div>
              )}
              <span className="material-symbols-outlined text-outline-variant/40 text-lg group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
            </div>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {(isOwner || myPermissions?.inventory_manage) && (
          <div className="lg:col-span-3 bg-surface-container-lowest border border-surface-container-high rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">inventory_2</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">{t("dashboard.inventoryAlerts")}</h2>
                  <p className="text-xs text-on-surface-variant/60">{t("stock.lowStock")}</p>
                </div>
              </div>
              {stats?.low_stock_count > 0 && (
                <div
                  // onClick={() => navigate('/Dashboard/StockManagement', { state: { lowStock: true } })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 hover:-translate-y-0.5 transition-all"
                >
                  <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
                  <span className="text-sm font-bold text-red-600 tabular-nums">{stats.low_stock_count}</span>
                  <span className="text-[11px] text-red-500/80 font-medium">low</span>
                </div>
              )}
              <button
                onClick={() => navigate('/Dashboard/StockManagement', { state: { lowStock: true } })}
                className="text-xs font-bold text-primary hover:text-primary-dim flex items-center gap-1 transition-colors"
              >
                {t("app.viewAll")}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="divide-y divide-surface-container-high">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <SkeletonBar className="w-1 h-12 rounded-full" />
                      <SkeletonBar className="w-10 h-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <SkeletonBar className="w-32 h-3" />
                        <SkeletonBar className="w-48 h-2" />
                      </div>
                      <SkeletonBar className="w-12 h-6" />
                    </div>
                  ))}
                </div>
              ) : (
                inventoryAlerts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/Dashboard/StockManagement')}
                  >
                    <InventoryProgressBar stock={item} max={100} t={t} />
                  </div>
                ))
              )}
            </div>
          </div>
          )}

          {/* OPERATING HOURS */}
          {(isOwner || myPermissions?.operating_hours_manage) && (
          <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-container-high rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">{t("pharmacy.operatingHours")}</h2>
                  <p className="text-xs text-on-surface-variant/60">Weekly schedule</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/Dashboard/EditPharmacy')}
                className="text-xs font-bold text-primary hover:text-primary-dim flex items-center gap-1 transition-colors"
              >
                {t("app.edit")}
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>

            <div className="divide-y divide-surface-container-high">
              {loading ? (
                <div className="p-4 grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <SkeletonBar key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : operatingHours.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant/50">schedule</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{t("app.noData")}</p>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-2 gap-2">
                  {operatingHours.map((day) => {
                    const isToday = new Date().getDay() === day.day_of_week;
                    const dayNames = [t("days.sunday"), t("days.monday"), t("days.tuesday"), t("days.wednesday"), t("days.thursday"), t("days.friday"), t("days.saturday")];
                    const dayName = dayNames[day.day_of_week];
                    return (
                      <div
                        key={day.day_of_week}
                        className={`rounded-xl border px-3 py-2.5 transition-all ${
                          isToday
                            ? 'border-primary/30 bg-primary-container/5 ring-1 ring-primary/10'
                            : 'border-surface-container-high hover:border-surface-container-hover'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {i18n.language === "ar" ? dayName : dayName.slice(0, 3)}
                          </span>
                          {isToday && (
                            <span className="text-[7px] font-bold text-white bg-primary px-1 py-0.5 rounded-full leading-none">{t("app.today")}</span>
                          )}
                        </div>
                        {day.is_closed ? (
                          <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full inline-block">{t("pharmacy.closed")}</span>
                        ) : day.is_24_hours ? (
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">{t("pharmacy.24h")}</span>
                        ) : (
                          <p className="text-[11px] font-semibold text-on-surface-variant tabular-nums">
                            {day.opening_time?.slice(0, 5)} — {day.closing_time?.slice(0, 5)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </main>
  );
}
