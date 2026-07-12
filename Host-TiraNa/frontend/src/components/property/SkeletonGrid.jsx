export default function SkeletonGrid({ count = 6 }) {
  return (
    <div className="property-grid" aria-busy="true" aria-label="Loading properties">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-media skeleton-shimmer" />
          <div className="skeleton-line skeleton-shimmer w-40" />
          <div className="skeleton-line skeleton-shimmer w-80" />
          <div className="skeleton-line skeleton-shimmer w-60" style={{ marginBottom: "var(--space-4)" }} />
        </div>
      ))}
    </div>
  );
}
