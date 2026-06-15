export function SkeletonCard() {
  return (
    <div className="rounded-lg p-4 animate-pulse" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="h-3 bg-border rounded w-2/3 mb-3" />
      <div className="h-7 bg-border rounded w-1/2 mb-2" />
      <div className="h-3 bg-border rounded w-1/3" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-lg p-5 animate-pulse" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="h-4 bg-border rounded w-1/3 mb-4" />
      <div className="h-48 bg-border rounded" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonChart key={i} />)}
      </div>
    </div>
  );
}
