import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "./Sidebar";
import NotificationProvider from "../contexts/NotificationContext";
import { authApi } from "../services/pharmacist";
import { employeeService } from "../services/pharmacist";
import { useTranslation } from "react-i18next";
import { useEcho } from "../contexts/EchoContext";
import { cacheInventory } from "../services/pharmacist";
import { api } from "../services/api";

export default function PharmacistLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { echo } = useEcho();
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [canCreatePharmacy, setCanCreatePharmacy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [myPermissions, setMyPermissions] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [orderVersion, setOrderVersion] = useState(0);

  const isVerified = verificationStatus === "approved";

  const refreshPharmacies = () => {
    authApi
      .dashboard()
      .then((res) => {
        const pharmacist = res.data?.pharmacist;
        setVerificationStatus(pharmacist?.verification_status ?? null);
        setCanCreatePharmacy(pharmacist?.can_create_pharmacy ?? false);
        const list = res.data?.pharmacies || [];
        setPharmacies(list);
        if (list.length > 0 && !selectedPharmacy) {
          setSelectedPharmacy(list[0]);
        }
        setLoaded(true);
      })
      .catch(() => {
        toast.error(t("errors.loadDashboard"));
        setLoaded(true);
      });
  };

  useEffect(() => {
    refreshPharmacies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPharmacy?.id) {
      setMyPermissions(null); // eslint-disable-line react-hooks/set-state-in-effect
      setIsOwner(false);
      setLoaded(true);
      return;
    }
    employeeService.myPermissions(selectedPharmacy.id)
      .then((res) => {
        const data = res?.data;
        setIsOwner(data?.role === "owner");
        const raw = data?.permissions ?? {};
        const boolPerms = {};
        for (const [key, val] of Object.entries(raw)) {
          boolPerms[key] = Boolean(val);
        }
        setMyPermissions(boolPerms);
        setLoaded(true);
      })
      .catch(() => {
        setIsOwner(false);
        setMyPermissions(null);
        setLoaded(true);
      });
  }, [selectedPharmacy?.id]);

  useEffect(() => {
    const pharmacyId = selectedPharmacy?.id;
    if (!pharmacyId || !navigator.onLine) return;
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory`, { params: { page: 1 } })
      .then(res => {
        const items = res?.data ?? [];
        if (items.length > 0) cacheInventory(items, pharmacyId);
      })
      .catch(() => {});
  }, [selectedPharmacy?.id]);

  useEffect(() => {
    const pharmacyId = selectedPharmacy?.id;
    if (!pharmacyId || !echo) return;

    const channelName = `pharmacy.${pharmacyId}`;
    const channel = echo.private(channelName);
    channel.listen(".medication.hold.requested", () => {
      toast.success(t("orders.newOrder", "New Order"), {
        onClick: () => navigate("/Dashboard/Requests"),
      });
    });
    channel.listen(".order.created", () => {
      toast.success(t("orders.newOrderReceived", "New Order Received"), {
        onClick: () => navigate("/Dashboard/Orders"),
      });
      setOrderVersion((v) => v + 1);
    });

    return () => {
      echo.leave(channelName);
    };
  }, [selectedPharmacy?.id, echo]);

  return (
    <NotificationProvider pharmacyId={selectedPharmacy?.id}>
      <div className="flex h-screen relative">
        <Sidebar
          pharmacies={pharmacies}
          selectedPharmacy={selectedPharmacy}
          setSelectedPharmacy={setSelectedPharmacy}
          isVerified={isVerified}
          canCreatePharmacy={canCreatePharmacy}
          verificationStatus={verificationStatus}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          myPermissions={myPermissions}
          isOwner={isOwner}
        />

        {/* overlay for mobile */}
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

          {verificationStatus === 'unverified' && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <span className="material-symbols-outlined text-amber-600 text-base">info</span>
                <span>{t("pharmacist.notVerified")}</span>
              </div>
              <Link
                to="/Dashboard/Settings"
                className="px-4 py-1.5 rounded-full bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-sm">settings</span>
                {t("pharmacist.goToSettings")}
              </Link>
            </div>
          )}
          <Outlet context={{ selectedPharmacy, refreshPharmacies, isVerified, verificationStatus, canCreatePharmacy, myPermissions, isOwner, loaded, orderVersion }} />
        </div>
      </div>
    </NotificationProvider>
  );
}
