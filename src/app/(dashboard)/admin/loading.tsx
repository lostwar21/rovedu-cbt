export default function Loading() {
  return (
    <div className="space-y-6 fade-in">
      {/* Banner Skeleton */}
      <div className="skeleton h-28 w-full" />

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="skeleton h-10 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-14" />
        ))}
      </div>
    </div>
  );
}
