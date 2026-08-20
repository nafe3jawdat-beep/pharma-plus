import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';

function InventoryProgressBar({ stock, max, t }) {
  const stockVal = stock.stock || 0;
  const pct = Math.min((stockVal / max) * 100, 100);
  const isLow = stockVal <= 20;
  const isMedium = stockVal <= 50;
  const color = isLow ? 'bg-red-400' : isMedium ? 'bg-amber-400' : 'bg-emerald-400';
  const bgColor = isLow ? 'bg-red-50' : isMedium ? 'bg-amber-50' : 'bg-emerald-50';
  const iconColor = isLow ? 'text-red-500' : isMedium ? 'text-amber-500' : 'text-emerald-500';
  const icon = isLow ? 'warning' : isMedium ? 'schedule' : 'check_circle';
  const barBg = isLow ? 'bg-red-100' : isMedium ? 'bg-amber-100' : 'bg-emerald-100';

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-surface transition-all cursor-pointer group">
      <div className={`w-1 h-12 rounded-full flex-shrink-0 ${color}`} />
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-on-surface truncate">{stock.name || stock.medication?.trade_name || "Unknown"}</p>
        <p className="text-xs text-on-surface-variant/70 mt-0.5">{stock.supplier || stock.medication?.trade_name || ""}</p>
        <div className={`mt-2 w-full h-2 ${barBg} rounded-full overflow-hidden`}>
          <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-end flex-shrink-0">
        <p className={`text-lg font-bold tabular-nums ${isLow ? 'text-red-500' : isMedium ? 'text-amber-600' : 'text-emerald-600'}`}>
          {stock.stock}
        </p>
        <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wide">{t("dashboard.left")}</p>
      </div>
    </div>
  );
}

function SkeletonBar({ className }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-lg ${className}`} />;
}

export default function InventoryAlerts({ inventoryAlerts, stats, loading }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { myPermissions, isOwner } = useOutletContext();

  if (!(isOwner || myPermissions?.inventory_manage)) return null;

  return (
    <div className="lg:col-span-3 bg-surface-container-lowest border border-surface-container-high rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-surface-container-high">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">inventory_2</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">{t("dashboard.inventoryAlerts")}</h2>
            <p className="text-xs text-on-surface-variant/60">{t("stock.lowStock")}</p>
          </div>
        </div>
        {stats?.low_stock_count > 0 && (
          <div
            onClick={() => navigate('/Dashboard/Batches', { state: { lowStock: true } })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 hover:-translate-y-0.5 transition-all"
          >
            <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
            <span className="text-sm font-bold text-red-600 tabular-nums">{stats.low_stock_count}</span>
            <span className="text-[11px] text-red-500/80 font-medium">low</span>
          </div>
        )}
        <button
          onClick={() => navigate('/Dashboard/Batches', { state: { lowStock: true } })}
          className="text-xs font-bold text-primary hover:text-primary-dim flex items-center gap-1 transition-colors"
        >
          {t("app.viewAll")}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      <div className="divide-y divide-surface-container-high">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <SkeletonBar className="w-1 h-12 rounded-full" />
                <SkeletonBar className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <SkeletonBar className="w-32 h-3" />
                  <SkeletonBar className="w-48 h-2" />
                </div>
                <SkeletonBar className="w-12 h-6" />
              </div>
            ))}
          </div>
        ) : (
          inventoryAlerts.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate('/Dashboard/Batches')}
            >
              <InventoryProgressBar stock={item} max={100} t={t} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
