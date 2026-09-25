import ProductCard from './ProductCard';

function SkeletonCard() {
  return (
    <div className="product-card product-card-skeleton" aria-hidden="true">
      <div className="product-photo" />
      <p className="product-name skeleton-line" />
      <p className="product-price skeleton-line skeleton-line-short" />
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
