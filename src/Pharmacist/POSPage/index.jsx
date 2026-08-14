import { useState, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { posApi, enqueuePosAction, lookupByBarcode, cacheInventory, getCachedInventory, stockApi } from '../../services/pharmacist';
import { useOffline } from '../../contexts/OfflineContext';
import { useBackendReachable } from '../../hooks/useBackendReachable';
import { useSendGrace } from '../../hooks/useSendGrace';
import BarcodeScanner from '../../components/BarcodeScanner';
import toast from 'react-hot-toast';
import POSHeader from './POSHeader';
import POSTable from './POSTable';
import POSTotalsBar from './POSTotalsBar';

const MODES = ['sale', 'damaged', 'return', 'reverseDamage', 'purchase'];

const MODE_TAB_KEYS = {
  sale: 'pos.completeSale',
  damaged: 'pos.modeDamaged',
  return: 'pos.modeReturn',
  reverseDamage: 'pos.modeReverseDamage',
  purchase: 'pos.modePurchase',
};

const MODE_ICONS = {
  sale: 'shopping_cart_checkout',
  damaged: 'broken_image',
  return: 'assignment_return',
  reverseDamage: 'restore_from_trash',
  purchase: 'local_shipping',
};

const MODE_SUBMIT_KEYS = {
  sale: 'pos.completeSale',
  damaged: 'pos.submitDamaged',
  return: 'pos.submitReturn',
  reverseDamage: 'pos.submitReverseDamage',
  purchase: 'pos.submitPurchase',
};

const MODE_SUCCESS_KEYS = {
  sale: 'pos.saleSuccess',
  damaged: 'pos.successDamaged',
  return: 'pos.successReturn',
  reverseDamage: 'pos.successReverseDamage',
  purchase: 'pos.successPurchase',
};

const OFFLINE_SPEC = {
  sale: {
    type: 'SALE',
    endpoint: (id) => `/api/v1/pharmacist/pharmacies/${id}/pos/checkout`,
    payload: (cart) => ({
      items: cart.map((c) => ({
        medication_id: c.medication_id,
        quantity: c.quantity,
        unit_price: c.price,
      })),
    }),
    stockEffects: (cart) => cart.map((c) => ({ medicationId: c.medication_id, delta: -c.quantity })),
  },
  damaged: {
    type: 'DAMAGED',
    endpoint: (id) => `/api/v1/pharmacist/pharmacies/${id}/pos/damaged`,
    payload: (cart, ctx) => ({
      notes: ctx.notes,
      items: cart.map((c) => {
        const selectedBatch = c.batches[c.selectedBatchIndex] || c.batches[0] || {};
        return { medication_id: c.medication_id, quantity: c.quantity, batch_id: selectedBatch.id || '' };
      }),
    }),
    stockEffects: (cart) => cart.map((c) => ({ medicationId: c.medication_id, delta: -c.quantity })),
  },
  return: {
    type: 'RETURN',
    endpoint: (id) => `/api/v1/pharmacist/pharmacies/${id}/pos/return`,
    payload: (cart, ctx) => ({
      original_invoice_number: ctx.invoiceNumber,
      items: cart.map((c) => ({ medication_id: c.medication_id, quantity: c.quantity })),
    }),
    stockEffects: (cart) => cart.map((c) => ({ medicationId: c.medication_id, delta: c.quantity })),
  },
  reverseDamage: {
    type: 'REVERSE_DAMAGE',
    endpoint: (id) => `/api/v1/pharmacist/pharmacies/${id}/pos/reverse-damage`,
    payload: (cart) => ({
      items: cart.map((c) => ({
        medication_id: c.medication_id,
        quantity: c.quantity,
        wholesale_price: String(c.wholesale_price),
      })),
    }),
    stockEffects: (cart) => cart.map((c) => ({ medicationId: c.medication_id, delta: c.quantity })),
  },
  purchase: {
    type: 'PURCHASE',
    endpoint: (id) => `/api/v1/pharmacist/pharmacies/${id}/pos/purchase`,
    payload: (cart, ctx) => ({
      supplier_name: ctx.supplierName,
      notes: ctx.notes,
      items: cart.map((c) => ({
        medication_id: c.medication_id,
        quantity: c.quantity,
        wholesale_price: String(c.wholesale_price),
        expiration_date: c.expiration_date,
      })),
    }),
    stockEffects: (cart) => cart.map((c) => ({ medicationId: c.medication_id, delta: c.quantity })),
  },
};

export default function POSPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [mode, setMode] = useState('sale');
  const [cart, setCart] = useState([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notes, setNotes] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');

  const { isOnline, pendingCount } = useOffline();
  const backendReachable = useBackendReachable();
  const isOffline = !isOnline || backendReachable === false;

  const buildCartItem = useCallback((item, barcode) => ({
    medication_id: item.medication_id ?? item.id,
    inventory_id: item.inventory_id ?? item.raw?.id ?? item.id,
    name: item.name,
    barcode: item.barcode ?? barcode,
    price: item.price || 0,
    available_stock: item.available_stock ?? item.stock ?? 0,
    batches: item.batches ?? item.raw?.batches ?? [],
    selectedBatchIndex: 0,
    quantity: 1,
    wholesale_price: item.batches?.[0]?.wholesale_price ?? item.raw?.batches?.[0]?.wholesale_price ?? '',
    expiration_date: item.batches?.[0]?.expiration_date ?? item.raw?.batches?.[0]?.expiration_date ?? '',
  }), []);

  useEffect(() => {
    let cancelled = false;
    if (selectedPharmacy?.id && navigator.onLine && backendReachable) {
      getCachedInventory(selectedPharmacy.id)
        .then((cached) => {
          if (cancelled || cached.length > 0) return null;
          return stockApi.fetchInventory(selectedPharmacy.id, 1);
        })
        .then((items) => {
          if (!cancelled && Array.isArray(items) && items.length > 0) {
            cacheInventory(items, selectedPharmacy.id).catch(() => {});
          }
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [selectedPharmacy?.id, backendReachable]);

  const handleScan = useCallback(async (barcode) => {
    if (!selectedPharmacy?.id) {
      toast.error(t('pos.noPharmacySelected'));
      return;
    }

    let item;
    let usedOfflineCache = false;

    if (!navigator.onLine || backendReachable === false) {
      usedOfflineCache = true;
      item = await lookupByBarcode(barcode);
    } else {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        item = await posApi.findItem(selectedPharmacy.id, barcode, { signal: controller.signal });
        clearTimeout(timer);
      } catch {
        item = await lookupByBarcode(barcode);
        usedOfflineCache = !!item;
      }
    }

    if (!item) {
      toast.error(usedOfflineCache ? t('pos.offlineNotCached') : t('pos.notFound'));
      return;
    }

    const cartItem = buildCartItem(item, barcode);
    setCart(prev => {
      const existing = prev.find(c => c.medication_id === cartItem.medication_id);
      if (existing) {
        toast(t('pos.alreadyInCart', { name: cartItem.name }), { icon: '\u2139\uFE0F' });
        return prev.map(c =>
          c.medication_id === cartItem.medication_id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, cartItem];
    });
    toast.success(t('pos.foundByBarcode'));
  }, [selectedPharmacy, backendReachable, buildCartItem, t]);

  const handleQuantityChange = useCallback((medicationId, newQty) => {
    const qty = Math.max(1, Math.min(999, Number(newQty) || 1));
    setCart(prev => prev.map(c =>
      c.medication_id === medicationId ? { ...c, quantity: qty } : c
    ));
  }, []);

  const handleBatchChange = useCallback((medicationId, batchIndex) => {
    setCart(prev => prev.map(c => {
      if (c.medication_id !== medicationId) return c;
      const batch = c.batches[batchIndex];
      return {
        ...c,
        selectedBatchIndex: batchIndex,
        wholesale_price: batch?.wholesale_price || c.wholesale_price,
        expiration_date: batch?.expiration_date || c.expiration_date,
      };
    }));
  }, []);

  const handleFieldChange = useCallback((medicationId, field, value) => {
    setCart(prev => prev.map(c =>
      c.medication_id === medicationId ? { ...c, [field]: value } : c
    ));
  }, []);

  const handleRemove = useCallback((medicationId) => {
    setCart(prev => {
      const item = prev.find(c => c.medication_id === medicationId);
      if (item) toast(t('pos.removedFromCart', { name: item.name }), { icon: '\uD83D\uDDD1\uFE0F' });
      return prev.filter(c => c.medication_id !== medicationId);
    });
  }, [t]);

  const handleClearAll = useCallback(() => {
    setCart([]);
    setNotes('');
    setInvoiceNumber('');
    setSupplierName('');
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const confirmSubmit = useCallback(async () => {
    try {
      const spec = OFFLINE_SPEC[mode];
      const payload = spec.payload(cart, { notes, invoiceNumber, supplierName });

      const submitOnline = async () => {
        if (mode === 'sale') {
          await posApi.checkout(selectedPharmacy.id, payload.items);
        } else if (mode === 'damaged') {
          await posApi.damaged(selectedPharmacy.id, payload);
        } else if (mode === 'return') {
          await posApi.return(selectedPharmacy.id, payload);
        } else if (mode === 'reverseDamage') {
          await posApi.reverseDamage(selectedPharmacy.id, payload);
        } else if (mode === 'purchase') {
          await posApi.purchase(selectedPharmacy.id, payload);
        }
      };

      const queueOffline = async () => {
        const result = await enqueuePosAction({
          pharmacyId: selectedPharmacy.id,
          type: spec.type,
          endpoint: spec.endpoint(selectedPharmacy.id),
          payload,
          stockEffects: spec.stockEffects(cart),
        });
        if (!result.success) throw new Error(result.error || 'Offline queue failed');
      };

      const clearCart = () => {
        setCart([]);
        setNotes('');
        setInvoiceNumber('');
        setSupplierName('');
      };

      if (!navigator.onLine || backendReachable === false) {
        await queueOffline();
        clearCart();
        toast(t('pos.offlineQueued'), { icon: '\uD83D\uDD04' });
        return;
      }

      try {
        await submitOnline();
      } catch (err) {
        if (!err.response) {
          await queueOffline();
          clearCart();
          toast(t('pos.offlineQueued'), { icon: '\uD83D\uDD04' });
          return;
        }
        throw err;
      }

      clearCart();
      toast.success(t(MODE_SUCCESS_KEYS[mode]));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('pos.saleFailed');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, selectedPharmacy, mode, notes, invoiceNumber, supplierName, backendReachable, t]);

  const { begin } = useSendGrace({
    onConfirm: confirmSubmit,
    onCancel: () => {
      setIsSubmitting(false);
      toast(t('sendGrace.cancelled'), { icon: '\u2716\uFE0F' });
    },
  });

  const handleSubmit = useCallback(() => {
    if (cart.length === 0) {
      toast(t('pos.cartEmpty'), { icon: '\u26A0\uFE0F' });
      return;
    }
    if (!selectedPharmacy?.id) {
      toast.error(t('pos.noPharmacySelected'));
      return;
    }

    if (mode === 'purchase') {
      if (!supplierName.trim()) {
        toast.error(t('pos.enterSupplierName'));
        return;
      }
      const invalidItems = cart.filter(
        (c) => !Number(c.wholesale_price) || Number(c.wholesale_price) <= 0 || !c.expiration_date
      );
      if (invalidItems.length > 0) {
        toast.error(t('pos.purchaseMissingFields', { items: invalidItems.map((c) => c.name).join(', ') }));
        return;
      }
    }

    setIsSubmitting(true);
    begin();
  }, [cart, selectedPharmacy, mode, supplierName, t, begin]);

  return (
    <div className="h-full overflow-y-auto bg-surface flex flex-col">
      <POSHeader
        onScan={handleScan}
        scannerOpen={scannerOpen}
        setScannerOpen={setScannerOpen}
        manualBarcode={manualBarcode}
        setManualBarcode={setManualBarcode}
        cart={cart}
        onClearAll={handleClearAll}
        isOffline={isOffline}
        pendingCount={pendingCount}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-32">
        <div className="mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/30 text-primary text-[11px] tracking-[0.05em] uppercase font-bold mb-3 sm:mb-4">
            <span className="material-symbols-outlined text-sm">point_of_sale</span>
            {selectedPharmacy?.name || t('pos.saleTitle')}
          </span>
          <h1 className="text-3xl sm:text-[3.25rem] leading-[1.1] tracking-[-0.02em] text-on-surface font-light mb-2 sm:mb-3">{t('pos.saleTitle')}</h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed">{t('pos.description') || t('pos.cartEmpty')}</p>
        </div>

        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <div className="inline-flex p-1 rounded-2xl bg-surface-container-high gap-1 min-w-max">
            {MODES.map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setCart([]); setNotes(''); setInvoiceNumber(''); setSupplierName(''); }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  mode === m
                    ? 'bg-gradient-to-r from-primary to-primary-dim text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-sm sm:text-lg">{MODE_ICONS[m]}</span>
                {t(MODE_TAB_KEYS[m])}
              </button>
            ))}
          </div>
        </div>

        {(mode === 'damaged' || mode === 'purchase') && (
          <div className="mb-6 max-w-xl">
            <label className="block text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant mb-2">{t('pos.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('pos.notesPlaceholder')}
              rows={2}
              className="w-full bg-surface-container-lowest border border-surface-container-high rounded-xl py-2.5 px-4 text-sm text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
          </div>
        )}

        {mode === 'return' && (
          <div className="mb-6 max-w-xl">
            <label className="block text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant mb-2">{t('pos.invoiceNumber')}</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder={t('pos.invoicePlaceholder')}
              className="w-full bg-surface-container-lowest border border-surface-container-high rounded-xl py-2.5 px-4 text-sm text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        )}

        {mode === 'purchase' && (
          <div className="mb-6 max-w-xl">
            <label className="block text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant mb-2">{t('pos.supplierName')}</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder={t('pos.supplierPlaceholder')}
              className="w-full bg-surface-container-lowest border border-surface-container-high rounded-xl py-2.5 px-4 text-sm text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        )}

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-32">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                <span className="material-symbols-outlined text-5xl text-primary/40" style={{ fontVariationSettings: "'wght' 250" }}>{MODE_ICONS[mode]}</span>
              </div>
              <div className="absolute -top-1 -end-1 w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center animate-bounce">
                <span className="material-symbols-outlined text-sm text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">{mode === 'sale' ? t('pos.saleTitle') : t(MODE_TAB_KEYS[mode])}</h3>
            <p className="text-on-surface-variant/70 text-sm max-w-md text-center mb-8 leading-relaxed">
              {mode === 'sale' && t('pos.cartEmpty')}
              {mode === 'damaged' && t('pos.damagedEmpty', 'Scan items to record damage')}
              {mode === 'return' && t('pos.returnEmpty', 'Scan items being returned')}
              {mode === 'reverseDamage' && t('pos.reverseDamageEmpty', 'Scan items to reverse damage')}
              {mode === 'purchase' && t('pos.purchaseEmpty', 'Scan items to record purchase')}
            </p>
            <button
              onClick={() => setScannerOpen(true)}
              className="group px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2.5"
            >
              <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">barcode_scanner</span>
              {t('scanner.scanBarcode')}
            </button>
          </div>
        ) : (
          <>
            <POSTable
              cart={cart}
              mode={mode}
              onQuantityChange={handleQuantityChange}
              onBatchChange={handleBatchChange}
              onFieldChange={handleFieldChange}
              onRemove={handleRemove}
            />
            <POSTotalsBar
              mode={mode}
              totalItems={totalItems}
              totalPrice={totalPrice}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              submittingLabel={t(MODE_SUBMIT_KEYS[mode])}
              submitIcon={MODE_ICONS[mode]}
            />
          </>
        )}
      </main>

      <BarcodeScanner open={scannerOpen} onScan={handleScan} onClose={() => setScannerOpen(false)} />
    </div>
  );
}
