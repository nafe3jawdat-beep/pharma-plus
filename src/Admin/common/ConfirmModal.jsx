export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, loading, destructive, icon }) {
  if (!open) return null;

  const defaultIcon = destructive ? "delete" : "help";
  const iconBg = destructive ? "bg-rose-100" : "bg-primary-container/30";
  const iconColor = destructive ? "text-rose-600" : "text-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high max-w-md w-full overflow-hidden animate-[fadeIn_0.2s_ease]">
        <div className="p-6 pb-4 text-center">
          <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-4`}>
            <span className={`material-symbols-outlined text-3xl ${iconColor}`}>{icon || defaultIcon}</span>
          </div>
          <h3 className="text-lg font-extrabold text-on-surface mb-2">{title}</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center gap-3 justify-center px-6 py-4 border-t border-surface-container-high bg-surface-container/30">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm ${
              destructive
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-primary hover:bg-primary-dim shadow-primary/25"
            }`}
          >
            {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
