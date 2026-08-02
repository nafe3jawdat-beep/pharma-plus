import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOffline } from '../contexts/OfflineContext';
import { isBackendReachable, subscribeBackend } from '../services/connectivity';

export function NetworkIndicator() {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const ctx = useOffline();
  const pendingCount = ctx?.pendingCount ?? 0;
  const [backendReachable, setBackendReachable] = useState(isBackendReachable());

  useEffect(() => subscribeBackend(setBackendReachable), []);

  const offline = !isOnline || backendReachable === false;

  if (!offline && pendingCount === 0) return null;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg transition-all ${
      offline
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    }`}>
      {offline ? (
        <WifiOff className="w-3.5 h-3.5" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      )}
      {offline ? t("offline") : `Syncing ${pendingCount} pending...`}
    </div>
  );
}
