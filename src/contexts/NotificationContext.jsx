import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { notificationApi } from "../services/pharmacist";
import { useEcho } from "./EchoContext";

const NotificationContext = createContext();
const POLL_INTERVAL = 180000;

// eslint-disable-next-line react-refresh/only-export-components
export const useNotificationCount = () => useContext(NotificationContext);

export default function NotificationProvider({ children, pharmacyId }) {
  const { echo } = useEcho();
  const [unreadCount, setUnreadCount] = useState(0);
  const inFlightRef = useRef(false);
  const intervalRef = useRef(null);

  const refresh = useCallback(() => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    notificationApi
      .fetchUnreadCount()
      .then((res) => setUnreadCount(res?.unread_count ?? 0))
      .catch(() => {})
      .finally(() => { inFlightRef.current = false; });
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL);
  }, [refresh]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (document.visibilityState === "visible") startPolling();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (!pharmacyId || !echo) return;

    const channelName = `pharmacy.${pharmacyId}`;
    const channel = echo.private(channelName);

    channel.notification(() => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      echo.leave(channelName);
    };
  }, [pharmacyId, echo]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}
