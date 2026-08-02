import { db } from '../db';
import { BaseUrl } from '../api';

const MAX_RETRIES = 5;

let isSyncing = false;
let stopRequested = false;

export async function processSyncQueue() {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;
  stopRequested = false;

  try {
    const pendingItems = await db.pendingActions
      .where('status')
      .equals('PENDING')
      .sortBy('createdAt');

    if (pendingItems.length === 0) {
      isSyncing = false;
      return;
    }

    for (const item of pendingItems) {
      if (stopRequested || !navigator.onLine) break;

      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(BaseUrl + item.endpoint, {
          method: item.method,
          headers,
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (response.ok) {
          await db.pendingActions.delete(item.id);

          if (item.type === 'SALE' && item.saleId) {
            await db.pendingSales.update(item.saleId, { synced: true });
          }
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        } else if (response.status >= 400 && response.status < 500) {
          await db.pendingActions.update(item.id, {
            attempts: item.attempts + 1,
            lastError: `Client error: ${response.status}`,
            status: 'FAILED',
          });
        } else {
          const attempts = item.attempts + 1;
          if (attempts >= MAX_RETRIES) {
            await db.pendingActions.update(item.id, {
              attempts,
              lastError: `Server error: ${response.status} (max retries exceeded)`,
              status: 'FAILED',
            });
          } else {
            await db.pendingActions.update(item.id, {
              attempts,
              lastError: `Server error: ${response.status}`,
            });
          }
        }
      } catch {
        break;
      }
    }
  } finally {
    isSyncing = false;
  }
}

export function startSyncEngine() {
  window.addEventListener('online', processSyncQueue);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      processSyncQueue();
    }
  });

  if (navigator.onLine) {
    processSyncQueue();
  }
}

export function stopSyncEngine() {
  stopRequested = true;
  window.removeEventListener('online', processSyncQueue);
}
