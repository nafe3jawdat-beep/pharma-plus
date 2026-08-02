export default function EmptyState({ icon = "info", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 px-4">
      <div className="w-24 h-24 rounded-2xl bg-surface-container-high flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30" style={{ fontVariationSettings: "'wght' 200" }}>
          {icon}
        </span>
      </div>
      <h3 className="text-xl font-extrabold text-on-surface mb-2">{title}</h3>
      {description && (
        <p className="text-on-surface-variant/60 text-sm max-w-sm text-center mb-8 leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}
