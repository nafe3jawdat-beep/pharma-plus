import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const SECTIONS = [
  {
    label: "nav.overview",
    links: [
      { to: "/Admin/Dashboard", icon: "dashboard", label: "nav.dashboard" },
      { to: "/Admin/Users", icon: "manage_accounts", label: "nav.users" },
    ],
  },
  {
    label: "nav.companies",
    links: [
      { to: "/Admin/Companies", icon: "business", label: "nav.allCompanies" },
      { to: "/Admin/Companies/Pending", icon: "pending_actions", label: "nav.companyVerifications" },
    ],
  },
  {
    label: "nav.staff",
    links: [
      { to: "/Admin/Doctors", icon: "stethoscope", label: "nav.allDoctors" },
      { to: "/Admin/Doctors/Pending", icon: "pending_actions", label: "nav.doctorVerifications" },
      { to: "/Admin/Pharmacists", icon: "medication", label: "nav.allPharmacists" },
      { to: "/Admin/Pharmacists/Pending", icon: "pending_actions", label: "nav.pharmacistVerifications" },
      { to: "/Admin/Specialists", icon: "biotech", label: "nav.specialists" },
      { to: "/Admin/ScientificReps", icon: "science", label: "nav.fieldReps" },
    ],
  },
  {
    label: "nav.patients",
    links: [
      { to: "/Admin/Patients", icon: "personal_injury", label: "nav.allPatients" },
    ],
  },
  {
    label: "nav.formulary",
    links: [
      { to: "/Admin/MedicalData/Diseases", icon: "coronavirus", label: "nav.chronicDiseases" },
      { to: "/Admin/MedicalData/Ingredients", icon: "science", label: "nav.activeIngredients" },
      { to: "/Admin/MedicalData/Medications", icon: "medication", label: "nav.medications" },
    ],
  },
  {
    label: "nav.review",
    links: [
      { to: "/Admin/Proposals", icon: "description", label: "nav.proposals" },
      { to: "/Admin/Activity", icon: "monitoring", label: "nav.activityLog" },
    ],
  },
  {
    label: "nav.system",
    links: [
      { to: "/Admin/Settings", icon: "settings", label: "nav.settings" },
    ],
  },
];

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userName = user?.f_name ? `${user.f_name} ${user.l_name || ""}`.trim() : "Admin";
  const initials = ((user?.f_name?.[0] || "") + (user?.l_name?.[0] || "")).toUpperCase() || "AD";

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
            <span className="material-symbols-outlined text-on-primary text-xl">admin_panel_settings</span>
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
              <p className="text-[11px] text-on-surface-variant font-medium">{t("nav.adminPanel")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/40 mb-1">
              {t(section.label)}
            </p>
            <div className="space-y-0.5">
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-primary" : "text-on-surface-variant/60 group-hover:text-on-surface-variant"}`}>
                        {link.icon}
                      </span>
                      <span className="truncate">{t(link.label)}</span>
                      {isActive && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-surface-container-high pt-3">
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
