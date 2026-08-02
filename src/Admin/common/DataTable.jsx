import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function DataTable({
  columns,
  data,
  meta,
  onPageChange,
  loading,
  selectedIds = [],
  onSelect,
  keyExtractor = (row) => row.id,
  emptyIcon = "table_rows",
  emptyTitle = "No data found",
  emptyDescription = "",
  emptyAction,
  onLoadMore,
  loadingMore,
}) {
  const sentinelRef = useRef(null);
  const { t } = useTranslation();

  const hasMore = meta && meta.current_page < meta.last_page;

  useEffect(() => {
    if (!onLoadMore || !sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loadingMore]);

  if (loading && data.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
        <div className="space-y-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse border-b border-surface-container-high/40 last:border-0">
              {onSelect && <div className="w-5 h-5 rounded-md bg-surface-container-high" />}
              {columns.map((_, ci) => (
                <div key={ci} className={`${ci === 0 ? "flex-[2]" : "flex-1"} h-4 rounded-md bg-surface-container-high/80`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-[36px] text-on-surface-variant/30">{emptyIcon}</span>
          </div>
          <h3 className="text-base font-bold text-on-surface mb-1.5">{emptyTitle}</h3>
          {emptyDescription && (
            <p className="text-sm text-on-surface-variant/60 max-w-xs text-center leading-relaxed">{emptyDescription}</p>
          )}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
      {columns.some((c) => c.header) && (
        <div className="px-6 py-3.5 border-b border-surface-container-high flex items-center gap-4 bg-surface-container/30">
          {onSelect && <div className="w-5 h-5 flex-shrink-0" />}
          {columns.map((col, ci) => (
            <div
              key={ci}
              className={col.className || "flex-1 min-w-0"}
              style={col.width ? { flex: `0 0 ${col.width}`, width: col.width } : undefined}
            >
              <p className="text-[11px] font-bold uppercase text-on-surface-variant/50 tracking-wider">
                {col.header || ""}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="divide-y divide-surface-container-high/40">
        {data.map((row) => {
          const id = keyExtractor(row);
          const isSelected = selectedIds.includes(id);
          return (
            <div
              key={id}
              className={`flex items-center gap-4 px-6 py-4 transition-all duration-150 ${
                isSelected ? "bg-primary/[0.04]" : "hover:bg-surface-container/40"
              }`}
            >
              {onSelect && (
                <label className="flex items-center justify-center w-5 h-5 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(id)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                </label>
              )}
              {columns.map((col, ci) => (
                <div
                  key={ci}
                  className={col.className || "flex-1 min-w-0"}
                  style={col.width ? { flex: `0 0 ${col.width}`, width: col.width } : undefined}
                >
                  {col.render ? col.render(row) : (
                    <p className="text-sm text-on-surface truncate">{row[col.key]}</p>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {loadingMore && (
        <div className="flex items-center justify-center gap-2.5 px-6 py-4 border-t border-surface-container-high">
          <span className="material-symbols-outlined text-sm animate-spin text-primary">refresh</span>
            <span className="text-xs text-on-surface-variant font-medium">{t("app.loadingMore")}</span>
        </div>
      )}

      {onLoadMore && hasMore && !loadingMore && (
        <div ref={sentinelRef} className="h-1" />
      )}

      {meta && !hasMore && data.length > 0 && (
        <div className="flex items-center justify-center px-6 py-3.5 border-t border-surface-container-high">
          <p className="text-xs text-on-surface-variant/40 font-medium">{t("app.allItemsLoaded", { count: meta.total })}</p>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-container-high bg-surface-container/20">
          <p className="text-xs text-on-surface-variant/50 font-medium">
            Page <span className="font-bold text-on-surface-variant/70">{meta.current_page}</span> of <span className="font-bold text-on-surface-variant/70">{meta.last_page}</span>
            <span className="text-on-surface-variant/30 mx-1.5">·</span>
            <span>{meta.total} total</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(meta.current_page - 1)}
              disabled={meta.current_page <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              onClick={() => onPageChange(meta.current_page + 1)}
              disabled={meta.current_page >= meta.last_page}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
