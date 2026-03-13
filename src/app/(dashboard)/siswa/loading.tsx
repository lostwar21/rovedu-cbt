export default function Loading() {
  return (
    <div className="space-y-6 fade-in">
      {/* Header Skeleton */}
      <div className="skeleton h-20 w-full" />

      {/* Exam List Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-52" />
        ))}
      </div>
    </div>
  );
}
