import { useTranslation } from 'react-i18next';

const thClass = "px-5 py-3.5 text-start text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant";
const thClassR = "px-5 py-3.5 text-end text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant";
const thClassC = "px-5 py-3.5 text-center text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant";
const inputClass = "bg-surface-container-low border border-surface-container-high rounded-lg py-1.5 px-2 text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all";

export default function POSTable({ cart, mode, onQuantityChange, onBatchChange, onFieldChange, onRemove }) {
  const { t } = useTranslation();

  const renderBatchSelect = (item, onBatchChange) => {
    const selectedBatch = item.batches[item.selectedBatchIndex] || item.batches[0] || {};
    if (item.batches.length > 1) {
      return (
        <select
          value={item.selectedBatchIndex}
          onChange={(e) => onBatchChange(item.medication_id, Number(e.target.value))}
          className={`${inputClass} cursor-pointer`}
        >
          {item.batches.map((b, i) => (
            <option key={b.id || i} value={i}>
              {b.batch_number} ({b.quantity})
            </option>
          ))}
        </select>
      );
    }
    return <span className="text-on-surface-variant text-xs font-medium">{selectedBatch.batch_number || '-'}</span>;
  };

  const renderStockBadge = (stock) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
      stock > 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
      stock > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
      'bg-rose-50 text-rose-700 border border-rose-200'
    }`}>
      {stock}
    </span>
  );

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container/60 border-b border-surface-container-high">
              <th className={thClass + " w-10"}>#</th>
              <th className={thClass}>{t('pos.name')}</th>
              <th className={thClass}>{t('pos.barcode')}</th>
              {mode === 'sale' && (
                <>
                  <th className={thClass}>{t('pos.batchNumber')}</th>
                  <th className={thClassR}>{t('pos.price')}</th>
                  <th className={thClassR}>{t('pos.wholesalePrice', 'Cost')}</th>
                  <th className={thClassR}>{t('pos.stock')}</th>
                  <th className={thClassR}>{t('pos.batchStock', 'Batch Qty')}</th>
                  <th className={thClass}>{t('pos.expires')}</th>
                </>
              )}
              {mode === 'damaged' && (
                <>
                  <th className={thClass}>{t('pos.batchNumber')}</th>
                  <th className={thClassR}>{t('pos.stock')}</th>
                </>
              )}
              {(mode === 'reverseDamage' || mode === 'purchase') && (
                <th className={thClassR}>{t('pos.wholesalePrice', 'Cost')}</th>
              )}
              {mode === 'purchase' && (
                <th className={thClass}>{t('pos.expires')}</th>
              )}
              <th className={thClassC + " w-24"}>{t('pos.qty')}</th>
              <th className="px-5 py-3.5 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {cart.map((item, idx) => {
              const selectedBatch = item.batches[item.selectedBatchIndex] || item.batches[0] || {};
              return (
              <tr key={item.medication_id} className="hover:bg-surface-container/30 transition-colors">
                <td className="px-5 py-4 text-on-surface-variant font-medium">{idx + 1}</td>
                <td className="px-5 py-4">
                  <p className="font-bold text-on-surface truncate max-w-[200px]">{item.name}</p>
                </td>
                <td className="px-5 py-4 text-on-surface-variant font-mono text-xs">{item.barcode}</td>
                {mode === 'sale' && (
                  <>
                    <td className="px-5 py-4">{renderBatchSelect(item, onBatchChange)}</td>
                    <td className="px-5 py-4 text-end font-bold text-on-surface tabular-nums">{item.price} <span className="text-on-surface-variant font-normal text-xs">{t('pos.currency')}</span></td>
                    <td className="px-5 py-4 text-end text-on-surface-variant tabular-nums text-xs">{selectedBatch.wholesale_price || 0} <span className="font-normal">{t('pos.currency')}</span></td>
                    <td className="px-5 py-4 text-end">{renderStockBadge(item.available_stock)}</td>
                    <td className="px-5 py-4 text-end text-on-surface-variant text-xs tabular-nums">{selectedBatch.quantity || 0}</td>
                    <td className="px-5 py-4 text-on-surface-variant text-xs">{selectedBatch.expiration_date || '-'}</td>
                  </>
                )}
                {mode === 'damaged' && (
                  <>
                    <td className="px-5 py-4">{renderBatchSelect(item, onBatchChange)}</td>
                    <td className="px-5 py-4 text-end">{renderStockBadge(item.available_stock)}</td>
                  </>
                )}
                {(mode === 'reverseDamage' || mode === 'purchase') && (
                  <td className="px-5 py-4 text-end">
                    <input
                      type="number"
                      min="0"
                      value={item.wholesale_price}
                      onChange={(e) => onFieldChange(item.medication_id, 'wholesale_price', e.target.value)}
                      className={`${inputClass} w-24 text-end tabular-nums`}
                    />
                  </td>
                )}
                {mode === 'purchase' && (
                  <td className="px-5 py-4">
                    <input
                      type="date"
                      value={item.expiration_date}
                      onChange={(e) => onFieldChange(item.medication_id, 'expiration_date', e.target.value)}
                      className={inputClass}
                    />
                  </td>
                )}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center">
                    <input
                      type="number"
                      min="1"
                      max={mode === 'sale' ? item.available_stock : 999}
                      value={item.quantity}
                      onChange={(e) => onQuantityChange(item.medication_id, e.target.value)}
                      className="w-16 text-center bg-surface-container-low border border-surface-container-high rounded-lg py-1.5 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all tabular-nums"
                    />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => onRemove(item.medication_id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-on-surface-variant hover:text-rose-500 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
