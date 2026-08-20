import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useNotificationCount } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '../../services/pharmacist';
import { operatingHourService } from '../../services/pharmacist';
import { employeeService } from '../../services/pharmacist';
import { cacheDashboard, getCachedDashboard } from '../../services/pharmacist';
import { NetworkIndicator } from '../../components/NetworkIndicator';
import StatCards from './StatCards';
import InventoryAlerts from './InventoryAlerts';
import OperatingHours from './OperatingHours';

export default function DashboardContent() {
  const { unreadCount } = useNotificationCount();
  const { theme, toggleTheme } = useTheme();
  const { selectedPharmacy, myPermissions, isOwner, loaded, canCreatePharmacy, orderVersion } = useOutletContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [prevOrderVersion, setPrevOrderVersion] = useState(orderVersion ?? 0);
  const [ordersPulse, setOrdersPulse] = useState(0);
  if (prevOrderVersion !== orderVersion) {
    setPrevOrderVersion(orderVersion);
    if (orderVersion > 0) setOrdersPulse((p) => p + 1);
  }
  const [stats, setStats] = useState(null);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [operatingHours, setOperatingHours] = useState([]);
  const [employeeAvatars, setEmployeeAvatars] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

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
              {greeting} {user.f_name}
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

        <StatCards stats={stats} ordersPulse={ordersPulse} loading={loading} />

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
          <InventoryAlerts inventoryAlerts={inventoryAlerts} stats={stats} loading={loading} />
          <OperatingHours operatingHours={operatingHours} loading={loading} />
        </div>
      </div>
    </main>
  );
}
