export default function PageHeader({ icon, title, description, children }) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{description || title}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">{title}</h1>
        {description && description !== title && (
          <p className="text-sm text-on-surface-variant mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-wrap">{children}</div>
      )}
    </header>
  );
}
