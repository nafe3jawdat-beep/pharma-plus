import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/db';
import { startSyncEngine, processSyncQueue } from '../services/pharmacist';
import { subscribeBackend } from '../services/connectivity';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    db.open().catch((err) => console.error('[offline] IndexedDB open failed', err));
    const handleVersionChange = () => {
      db.close();
    };
    db.on('versionchange', handleVersionChange);

    startSyncEngine();

    const handleBackendReachable = (reachable) => {
      if (reachable === true && navigator.onLine) processSyncQueue();
    };
    const unsubscribeBackend = subscribeBackend(handleBackendReachable);

    const checkQueue = async () => {
      try {
        const count = await db.pendingActions.where('status').equals('PENDING').count();
        setPendingCount(count);
      } catch {
        setPendingCount(0);
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 3000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        processSyncQueue();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribeBackend();
      db.on.versionchange.unsubscribe(handleVersionChange);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline, pendingCount, triggerSync: processSyncQueue }}>
      {children}
    </OfflineContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useOffline = () => useContext(OfflineContext);
