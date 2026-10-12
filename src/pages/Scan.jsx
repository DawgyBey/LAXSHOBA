import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useHomepageContent from '../hooks/useHomepageContent';
import ProductGrid from '../components/ProductGrid';
import { getProducts } from '../lib/data';

export default function Scan() {
  const content = useHomepageContent();
  const productIds = content?.scanProductIds || [];
  const productIdsKey = productIds.join('|');

  const title = content?.scanTitle || 'Latest & Loved';
  const description = content?.scanDescription || 'Explore the latest and most-loved pieces from LAXSHOBHA.';
  useDocumentTitle(`${title} — LAXSHOBHA`);

  const picks = useAsync(async () => {
    if (content === null) return [];
    const products = await getProducts(true);
    if (productIds.length) {
      const byId = new Map(products.map((product) => [product.id, product]));
      return productIds.slice(0, 12).map((id) => byId.get(id)).filter(Boolean);
    }
    const hotPicks = products.filter((product) => product.isHotPick);
    return (hotPicks.length ? hotPicks : products).slice(0, 12);
  }, [content !== null, productIdsKey]);

  return (
    <main className="scan-page">
      <header className="scan-intro">
        <p className="scan-eyebrow">LAXSHOBHA · BOUTIQUE PICKS</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <section className="section scan-products">
        <div className="container">
          <div className="section-head">
            <h2>Shop the edit</h2>
          </div>
          <ProductGrid products={picks.data || []} loading={content === null || picks.loading} />
        </div>
      </section>
    </main>
  );
}