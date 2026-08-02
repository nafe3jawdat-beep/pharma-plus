export function SkeletonBar({ className }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-lg ${className}`} />;
}

export default function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-4 p-8">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonBar className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2.5">
            <SkeletonBar className="w-1/3 h-3" />
            <SkeletonBar className="w-1/2 h-2" />
          </div>
          <SkeletonBar className="w-20 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[40vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
        </div>
        <p className="text-sm text-on-surface-variant font-semibold tracking-wide">Loading...</p>
      </div>
    </div>
  );
}
