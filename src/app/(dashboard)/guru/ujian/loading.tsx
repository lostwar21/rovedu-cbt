export default function Loading() {
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div className="skeleton h-10 w-56" />
        <div className="skeleton h-10 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    </div>
  );
}
