import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { isOrderSoundEnabled, setOrderSoundEnabled } from "../utils/sound";

export default function Sidebar({ pharmacies, selectedPharmacy, setSelectedPharmacy, isVerified,  sidebarOpen, setSidebarOpen, myPermissions, isOwner }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isOrderSoundEnabled());

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const linkClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-3 px-4 py-3 font-medium text-sm text-primary font-bold bg-primary-container/30 rounded-xl transition-colors"
      : "flex items-center gap-3 px-4 py-3 font-medium text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl transition-colors";

  return (
    <nav className={`flex flex-col h-full p-4 space-y-2 border-r border-surface-container-high bg-surface w-64 flex-shrink-0 fixed md:relative z-30 top-0 left-0 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

      {/* mobile close */}
      <div className="flex justify-end md:hidden mb-1">
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>

      {/* Brand / Pharmacist Name */}
      <div className="flex items-center gap-3 px-4 py-5 mb-2 rounded-xl hover:bg-surface-container-high transition-colors">
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-primary font-bold text-xl">
          {(user?.f_name?.[0] || '') + (user?.l_name?.[0] || '') || "PH"}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold text-primary truncate max-w-[130px]">{user?.f_name ? `${user.f_name} ${user.l_name || ''}`.trim() : "Pharmacist"}</h1>
            {isVerified ? (
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            ) : (
              <span className="material-symbols-outlined text-amber-500 text-lg">pending</span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant">{t("nav.centralStation")}</p>
        </div>
      </div>

      {/* Links */}
      <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] space-y-1 px-2">

        <NavLink to="/Dashboard" end className={linkClass}>
          <span className="material-symbols-outlined">dashboard</span>
          {t("nav.dashboard")}
        </NavLink>

        {(isOwner || myPermissions?.orders_process) && (
          <>
            <NavLink to="/Dashboard/Requests" className={linkClass}>
              <span className="material-symbols-outlined">receipt_long</span>
              {t("nav.requests")}
            </NavLink>
            <NavLink to="/Dashboard/Orders" className={linkClass}>
              <span className="material-symbols-outlined">order_approve</span>
              {t("nav.orders")}
            </NavLink>
          </>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined">store</span>
            <span className="flex-1 text-start truncate">{selectedPharmacy?.name || t("nav.selectPharmacy")}</span>
            <span className="material-symbols-outlined text-sm transition-transform" style={{ transform: open ? "rotate(180deg)" : "" }}>expand_more</span>
          </button>
          {open && (
            <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-primary-container pl-3">
              {pharmacies.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPharmacy(p); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                    selectedPharmacy?.id === p.id
                      ? "bg-primary-container/20 text-primary font-bold"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {selectedPharmacy?.id === p.id ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <span className="flex-1 text-start truncate">{p.name}</span>
                  {p.is_owner && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-container text-primary">{t("nav.owner")}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {isVerified && (isOwner || myPermissions?.inventory_manage) && (
          <NavLink to="/Dashboard/Medications" className={linkClass}>
            <span className="material-symbols-outlined">medication</span>
            {t("nav.medications")}
          </NavLink>
        )}

   

        {isVerified && (isOwner ) && (
          <NavLink to="/Dashboard/AddPharmacy" className={linkClass}>
            <span className="material-symbols-outlined">add_business</span>
            {t("nav.addPharmacy")}
          </NavLink>
        )}

        {selectedPharmacy && (isOwner || myPermissions?.inventory_manage) && (
          <>
            <NavLink to="/Dashboard/StockManagement" className={linkClass}>
              <span className="material-symbols-outlined">inventory_2</span>
              {t("nav.inventory")}
            </NavLink>
            <NavLink to="/Dashboard/POS" className={linkClass}>
              <span className="material-symbols-outlined">point_of_sale</span>
              {t("nav.pos")}
            </NavLink>
            <NavLink to="/Dashboard/Batches" className={linkClass}>
              <span className="material-symbols-outlined">science</span>
              {t("nav.batches")}
            </NavLink>
          </>
        )}
        {selectedPharmacy && (isOwner || myPermissions?.pharmacy_manage || myPermissions?.operating_hours_manage) && (
          <NavLink to="/Dashboard/EditPharmacy" className={linkClass}>
            <span className="material-symbols-outlined">store</span>
            {t("nav.editPharmacy")}
          </NavLink>
        )}
        {selectedPharmacy && (isOwner) && (
          <>
            <NavLink to="/Dashboard/Employees" className={linkClass}>
              <span className="material-symbols-outlined">group</span>
              {t("nav.employees")}
            </NavLink>
            <NavLink to="/Dashboard/Salaries" className={linkClass}>
              <span className="material-symbols-outlined">payments</span>
              {t("nav.salaries")}
            </NavLink>
            <NavLink to="/Dashboard/Expenses" className={linkClass}>
              <span className="material-symbols-outlined">account_balance_wallet</span>
              {t("nav.expenses")}
            </NavLink>
            <NavLink to="/Dashboard/Finance" className={linkClass}>
              <span className="material-symbols-outlined">account_balance</span>
              {t("nav.Reports")}
            </NavLink>
            <NavLink to="/Dashboard/AnalyticsPage" className={linkClass}>
              <span className="material-symbols-outlined">monitoring</span>
              {t("nav.analytics")}
            </NavLink>
          </>
        )}

        <NavLink to="/Dashboard/FindPharmacy" className={linkClass}>
          <span className="material-symbols-outlined">search</span>
          {t("nav.findPharmacy")}
        </NavLink>

      </div>

      <div className="border-t border-outline-variant/30 pt-3 px-4 space-y-1">
      {(isOwner ) && (  
           <>
           <NavLink to="/Dashboard/AddDrugPage" className={linkClass}>
          <span className="material-symbols-outlined">pill</span>
          {t("nav.addDrug")}
        </NavLink>
        <NavLink to="/Dashboard/Proposals" className={linkClass}>
          <span className="material-symbols-outlined">description</span>
          {t("nav.myProposals")}
        </NavLink>
        </>
      )}
        <button
          onClick={() => { const next = !soundOn; setSoundOn(next); setOrderSoundEnabled(next); }}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl transition-all font-medium"
        >
          <span className="material-symbols-outlined">{soundOn ? "volume_up" : "volume_off"}</span>
          {soundOn ? t("nav.soundOn", "Order sound: On") : t("nav.soundOff", "Order sound: Off")}
        </button>
        <NavLink to="/Dashboard/Settings" className={({ isActive }) =>
          `flex items-center gap-3 w-full px-4 py-3 text-sm rounded-xl transition-all font-medium ${
            isActive
              ? 'text-primary bg-primary-container/30 font-bold'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
          }`
        }>
          <span className="material-symbols-outlined">settings</span>
          {t("nav.settings")}
        </NavLink>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-on-surface-variant hover:text-rose-600 hover:bg-rose-900/10 rounded-xl transition-all font-medium"
        >
          <span className="material-symbols-outlined">logout</span>
          {t("nav.logout")}
        </button>
      </div>
    </nav>
  );
}
