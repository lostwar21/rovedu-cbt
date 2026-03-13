export default function Loading() {
  return (
    <div className="space-y-6 fade-in">
      <div className="skeleton h-12 w-64" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-20" />
        ))}
      </div>
    </div>
  );
}
