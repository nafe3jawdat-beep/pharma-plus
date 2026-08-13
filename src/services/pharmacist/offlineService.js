import { db } from '../db';

export async function lookupByBarcode(barcode) {
  try {
    const item = await db.inventory.where('barcode').equals(barcode).first();
    return item || null;
  } catch {
    return null;
  }
}

export async function enqueuePosAction({ pharmacyId, type, endpoint, method = 'POST', payload, stockEffects = [] }) {
  try {
    return await db.transaction('rw', db.pendingSales, db.pendingActions, db.inventory, async () => {
      let saleId = null;

      if (type === 'SALE') {
        saleId = await db.pendingSales.add({
          pharmacyId,
          items: (payload.items || []).map((it) => ({
            medicationId: it.medication_id,
            quantity: it.quantity,
            unitPrice: it.unit_price,
          })),
          totalAmount: (payload.items || []).reduce(
            (sum, it) => sum + Number(it.unit_price) * Number(it.quantity),
            0
          ),
          createdAt: new Date().toISOString(),
          synced: false,
        });
      }

      for (const effect of stockEffects) {
        const localProd = await db.inventory.get(effect.medicationId);
        if (localProd) {
          await db.inventory.update(effect.medicationId, {
            stock: Math.max(0, (localProd.stock || 0) + effect.delta),
          });
        }
      }

      await db.pendingActions.add({
        type,
        endpoint,
        method,
        body: payload,
        saleId,
        dependsOn: null,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        attempts: 0,
        lastError: null,
      });

      return { success: true, saleId };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function recordOfflineSale(saleData) {
  return enqueuePosAction({
    pharmacyId: saleData.pharmacyId,
    type: 'SALE',
    endpoint: `/api/v1/pharmacist/pharmacies/${saleData.pharmacyId}/pos/checkout`,
    payload: {
      items: saleData.items.map((it) => ({
        medication_id: it.medicationId,
        quantity: it.quantity,
        unit_price: it.unitPrice,
      })),
    },
    stockEffects: saleData.items.map((it) => ({
      medicationId: it.medicationId,
      delta: -it.quantity,
    })),
  });
}

export async function cacheInventory(items, pharmacyId) {
  const timestamp = new Date().toISOString();
  await db.transaction('rw', db.inventory, async () => {
    await db.inventory.where('pharmacyId').equals(pharmacyId).delete();
    const mapped = items.map(item => ({
      id: item.medication_id ?? item.id,
      pharmacyId,
      barcode: item.medication?.barcode ?? '',
      name: item.medication?.trade_name ?? '',
      price: item.price ?? 0,
      stock: item.stock ?? 0,
      min_stock: item.min_stock ?? 0,
      cachedAt: timestamp,
      raw: item,
    }));
    await db.inventory.bulkPut(mapped);
  });
}

export async function getCachedInventory(pharmacyId) {
  try {
    return await db.inventory.where('pharmacyId').equals(pharmacyId).toArray();
  } catch (err) {
    console.error('[cache] getCachedInventory failed', err);
    return [];
  }
}

export async function getOldestCacheTime(pharmacyId) {
  try {
    const items = await db.inventory.where('pharmacyId').equals(pharmacyId).toArray();
    if (items.length === 0) return null;
    return items.reduce((oldest, item) => {
      const d = new Date(item.cachedAt);
      return d < oldest ? d : oldest;
    }, new Date());
  } catch (err) {
    console.error('[cache] getOldestCacheTime failed', err);
    return null;
  }
}

export async function cacheDashboard(pharmacyId, data) {
  await db.dashboardCache.put({
    pharmacyId,
    data,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedDashboard(pharmacyId) {
  try {
    const record = await db.dashboardCache.get(pharmacyId);
    return record?.data ?? null;
  } catch (err) {
    console.error('[cache] getCachedDashboard failed', err);
    return null;
  }
}

export async function cacheEmployees(pharmacyId, data) {
  await db.employeeCache.put({
    pharmacyId,
    data,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedEmployees(pharmacyId) {
  try {
    const record = await db.employeeCache.get(pharmacyId);
    return record?.data ?? [];
  } catch (err) {
    console.error('[cache] getCachedEmployees failed', err);
    return [];
  }
}

export async function cacheBatches(pharmacyId, itemId, data) {
  await db.batchCache.put({
    key: `${pharmacyId}:${itemId}`,
    data,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedBatches(pharmacyId, itemId) {
  try {
    const record = await db.batchCache.get(`${pharmacyId}:${itemId}`);
    return record?.data ?? [];
  } catch (err) {
    console.error('[cache] getCachedBatches failed', err);
    return [];
  }
}
