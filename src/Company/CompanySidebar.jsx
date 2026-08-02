import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const NAV_ITEMS = [
  { to: "/Company/Dashboard", end: true, icon: "dashboard", labelKey: "nav.dashboard" },
  { to: "/Company/Dashboard/Reps", icon: "group", labelKey: "nav.reps" },
  { to: "/Company/Dashboard/Schedules", icon: "calendar_month", labelKey: "nav.schedules" },
  { to: "/Company/Dashboard/Visits", icon: "fact_check", labelKey: "nav.visits" },
  { to: "/Company/Dashboard/Assignments", icon: "link", labelKey: "nav.assignments" },
];

export default function CompanySidebar({ sidebarOpen, setSidebarOpen }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userName = user?.f_name ? `${user.f_name} ${user.l_name || ""}`.trim() : "Company";
  const initials = ((user?.f_name?.[0] || "") + (user?.l_name?.[0] || "")).toUpperCase() || "CO";

  return (
    <nav className={`flex flex-col h-full w-64 flex-shrink-0 fixed md:relative z-30 top-0 left-0 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

      {/* Mobile close */}
      <div className="flex justify-end md:hidden px-4 pt-4">
        <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>

      {/* Brand + User */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 px-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-on-primary text-xl">spa</span>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-primary">{t("brand")}</span>
        </div>

        <div className="bg-surface-container rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-container/40 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-extrabold text-primary">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{userName}</p>
              <p className="text-[11px] text-on-surface-variant font-medium">{t("nav.companyDashboard")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-xl ${isActive ? "text-primary" : "text-on-surface-variant/60 group-hover:text-on-surface-variant"}`}>
                  {item.icon}
                </span>
                <span>{t(item.labelKey)}</span>
                {isActive && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-surface-container-high pt-3">
        <NavLink
          to="/Company/Dashboard/Settings"
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`
          }
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          <span>{t("nav.settings")}</span>
        </NavLink>

        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </nav>
  );
}
