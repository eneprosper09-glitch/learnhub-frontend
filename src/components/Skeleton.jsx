export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-ink-200 rounded ${className}`} />;
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-card">
      <Skeleton className="aspect-video rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-4 flex gap-4 shadow-card">
      <Skeleton className="w-32 h-20 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="w-16 h-16 rounded-full" />
    </div>
  );
}
