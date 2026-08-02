import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  const { t } = useTranslation();
  const { role, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated || role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-surface relative">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-container-lowest border-b border-surface-container-high">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-primary">menu</span>
          </button>
          <span className="font-extrabold text-primary">{t("brand")}</span>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
