import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';

function StatCard({ icon, label, value, onClick, accent, gradient, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={`relative group overflow-hidden rounded-2xl bg-surface-container-lowest border border-surface-container-high p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${className}`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center shadow-sm`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">{label}</p>
        </div>
        <div className="flex items-end gap-1.5">
          <h2 className="text-4xl font-bold text-on-surface tracking-tight tabular-nums">{value ?? "--"}</h2>
        </div>
      </div>
      {onClick && (
        <span className="material-symbols-outlined absolute top-4 right-4 text-outline-variant/40 text-lg group-hover:translate-x-0.5 transition-transform">
          arrow_forward
        </span>
      )}
    </div>
  );
}

function SkeletonBar({ className }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-lg ${className}`} />;
}

export default function StatCards({ stats, ordersPulse, loading }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { myPermissions, isOwner } = useOutletContext();

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-surface-container-lowest border border-surface-container-high p-6">
            <SkeletonBar className="w-10 h-10 mb-4" />
            <SkeletonBar className="w-24 h-3 mb-2" />
            <SkeletonBar className="w-20 h-8" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      <StatCard
        icon="inventory_2"
        label={t("dashboard.inventoryItems")}
        value={stats?.total_stock}
        onClick={isOwner || myPermissions?.inventory_manage ? () => navigate('/Dashboard/StockManagement') : undefined}
        accent="bg-primary-container/30 text-primary"
        gradient="bg-gradient-to-br from-primary/[0.04] to-transparent"
      />
      <StatCard
        key={`pending-orders-${ordersPulse}`}
        icon="receipt_long"
        label={t("dashboard.pendingOrders")}
        value={stats?.pending_orders_count}
        onClick={isOwner || myPermissions?.orders_process ? () => navigate('/Dashboard/Requests') : undefined}
        accent="bg-secondary-container/30 text-on-secondary-container"
        gradient="bg-gradient-to-br from-secondary/[0.04] to-transparent"
        className={ordersPulse > 0 ? 'animate-order-bounce' : ''}
      />
      <StatCard
        icon="star"
        label={t("dashboard.averageRating")}
        value={stats?.average_rating != null ? Number(stats.average_rating).toFixed(1) : undefined}
        accent="bg-amber-100 text-amber-600"
        gradient="bg-gradient-to-br from-amber-50 to-transparent"
      />
    </div>
  );
}
