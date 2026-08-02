import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import CompanySidebar from "./CompanySidebar";

export default function CompanyLayout() {
  const { t } = useTranslation();
  const { role, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated || role !== "company") {
    return <Navigate to="/login" replace />;
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
