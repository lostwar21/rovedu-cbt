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

      {/* Analytics Skeleton */}
      <div className="skeleton h-8 w-64" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="skeleton h-72" />
        <div className="skeleton h-72" />
      </div>

      {/* Bottom Panels Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="skeleton h-64" />
        <div className="skeleton h-64" />
      </div>
    </div>
  );
}
