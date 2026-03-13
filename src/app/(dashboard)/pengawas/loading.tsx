export default function Loading() {
  return (
    <div className="space-y-6 fade-in">
      {/* Header Skeleton */}
      <div className="skeleton h-20 w-full" />

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-40" />
        ))}
      </div>
    </div>
  );
}
