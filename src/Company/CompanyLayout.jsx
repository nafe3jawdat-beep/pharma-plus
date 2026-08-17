import { useState } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import CompanySidebar from "./CompanySidebar";

export default function CompanyLayout() {
  const { t } = useTranslation();
  const { role, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated || role !== "company") {
    return <Navigate to="/login" replace />;
  }

  const verificationStatus = user?.verification_status;

  if (verificationStatus !== "active") {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 antialiased">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-amber-600 text-3xl">pending_actions</span>
            </div>
            <h1 className="text-2xl font-extrabold text-on-surface mb-3">
              {t("company.notVerifiedTitle")}
            </h1>
            <p className="text-on-surface-variant leading-relaxed">
              {t("company.notVerifiedDescription")}
            </p>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-dim transition-all"
          >
            {t("company.logout")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen relative">
      <CompanySidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-surface-container-high">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-primary">menu</span>
          </button>
          <span className="text-sm font-bold text-primary">{t("brand")}</span>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
