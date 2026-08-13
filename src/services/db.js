import Dexie from 'dexie';

export const db = new Dexie('PharmaPlusOfflineDB');

db.version(1).stores({
  inventory: 'id, pharmacyId, barcode, name, price, stock, cachedAt',
  pendingActions: '++id, type, endpoint, method, body, dependsOn, status, createdAt, attempts, lastError',
  pendingSales: '++id, items, totalAmount, createdAt, synced'
});

db.version(2).stores({
  dashboardCache: 'pharmacyId',
  employeeCache: 'pharmacyId',
});

db.version(3).stores({
  batchCache: 'key',
});
