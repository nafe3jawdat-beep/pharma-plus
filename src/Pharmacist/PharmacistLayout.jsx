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
import { playOrderSound } from "../utils/sound";

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

  const notifyOrder = (type, title, subtitle) => {
    const isRequests = type === "requests";
    const path = "/Dashboard/Requests";
    const icon = isRequests ? "orders" : "receipt_long";
    const iconTint = isRequests ? "bg-primary-container/40 text-primary" : "bg-amber-100 text-amber-600";
    const strip = isRequests ? "from-primary to-primary/20" : "from-amber-400 to-amber-200";

    toast.custom(
      (t) => (
        <button
          onClick={() => {
            navigate(path);
            toast.dismiss(t.id);
          }}
          className="group relative overflow-hidden flex items-center gap-3.5 bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-lg pl-5 pr-4 py-3.5 cursor-pointer text-left w-[340px] max-w-[calc(100vw-2rem)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/40"
        >
          <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${strip}`} />
          <span className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${iconTint}`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-surface-container-lowest">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
            </span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-on-surface leading-tight">{title}</span>
            <span className="block text-xs text-on-surface-variant/70 mt-0.5">{subtitle}</span>
          </span>
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors group-hover:bg-primary group-hover:text-on-primary">
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </span>
        </button>
      ),
      { duration: 10000 }
    );
  };

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
        if (items.length > 0) cacheInventory(items, pharmacyId).catch((err) => console.error('[cache] layout inventory', err));
      })
      .catch(() => {});
  }, [selectedPharmacy?.id]);

  useEffect(() => {
    const pharmacyId = selectedPharmacy?.id;
    if (!pharmacyId || !echo) return;

    const channelName = `pharmacy.${pharmacyId}`;
    const channel = echo.private(channelName);
    console.log(`[WS] subscribing to ${channelName}`);
    channel.error((e) => console.error(`[WS] subscription error ${channelName}`, e));
    if (channel.subscription) {
      channel.subscription.bind("pusher:subscription_succeeded", () => {
        console.log(`[WS] subscribed ${channelName}`);
      });
    }
    channel.listen(".medication.hold.requested", (event) => {
      console.log("[WS] medication.hold.requested", event);
      playOrderSound();
      notifyOrder("requests", t("orders.newOrder", "New Order"), t("orders.clickToViewRequests", "Click to view requests"));
      setOrderVersion((v) => v + 1);
    });
    channel.listen(".order.created", (event) => {
      console.log("[WS] order.created", event);
      playOrderSound();
      notifyOrder("created", t("orders.newOrderReceived", "New Order Received"), t("orders.clickToViewOrders", "Click to view orders"));
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
