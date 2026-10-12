import ProductCard from './ProductCard';

function SkeletonCard() {
  return (
    <div className="pcard pcard-skeleton" aria-hidden="true">
      <div className="pcard-media" />
      <div className="pcard-body">
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line-short" />
      </div>
    </div>
  );
}

// Pass emptyMessage={null} to render nothing at all when there are no products.
export default function ProductGrid({
  products,
  emptyMessage = 'No products here yet.',
  showBadge = false,
  loading = false,
  skeletonCount = 8,
}) {
  if (loading) {
    return (
      <div className="product-grid" aria-busy="true">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.length === 0
        ? emptyMessage && <p className="empty-state">{emptyMessage}</p>
        : products.map((p) => <ProductCard key={p.id} product={p} showBadge={showBadge} />)}
    </div>
  );
}
