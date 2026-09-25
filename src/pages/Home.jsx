// Homepage. Everything here reads from the API — nothing is hardcoded except the
// section labels, so the admin panel controls the actual content.
import { Link } from 'react-router-dom';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useHomepageContent from '../hooks/useHomepageContent';
import usePageSEO from '../hooks/usePageSEO';
import ProductGrid from '../components/ProductGrid';
import { DEFAULT_ABOUT_TEXT, DEFAULT_HERO, DEFAULT_HERO_IMAGE, DEMO_PRODUCTS, PLACEHOLDER } from '../lib/constants';
import { getCategories, getProduct, getProducts } from '../lib/data';

function Section({ title, viewAllTo, tight = true, children }) {
  return (
    <section className={`section${tight ? ' section-tight' : ''}`}>
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
          {viewAllTo && <Link to={viewAllTo}>View all</Link>}
        </div>
        {children}
      </div>
    </section>
  );
}

function catalogAfterLoad(result, fallback) {
  return result.data?.length ? result.data : fallback;
}

export default function Home() {
  useDocumentTitle('LAXSHOBHA — Draped in Beauty');
  usePageSEO('home', 'LAXSHOBHA — Draped in Beauty', 'Traditional sarees, kurtas, and festive wear chosen with care.');
  const content = useHomepageContent();
  const homepageReady = content !== null;

  const categories = useAsync(async () =>
    (await getCategories()).filter((category) => !category.parentId).slice(0, 8));

  const hotPicks = useAsync(async () =>
    (await getProducts(true)).filter((product) => product.isHotPick).slice(0, 8));

  const newArrivals = useAsync(async () =>
    (await getProducts(true)).slice(0, 8));

  // "Featured For You" is a hand-picked list of product ids stored on the homepage document.
  const featuredIds = content?.featuredProductIds;
  const featured = useAsync(async () => {
    if (!homepageReady) return [];
    if (!featuredIds || featuredIds.length === 0) return [];
    const products = await Promise.all(featuredIds.slice(0, 8).map((id) => getProduct(id).catch(() => null)));
    return products.filter(Boolean);
  }, [homepageReady, featuredIds]);

  const featuredLoading = !homepageReady || featured.loading;
  const featuredProducts = catalogAfterLoad(featured, DEMO_PRODUCTS);
  const hotProducts = catalogAfterLoad(hotPicks, DEMO_PRODUCTS.filter((p) => p.isHotPick));
  const arrivalProducts = catalogAfterLoad(newArrivals, DEMO_PRODUCTS);

  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-media">
          <img src={content?.heroImage || DEFAULT_HERO_IMAGE || PLACEHOLDER.hero} alt="A saree from our latest collection" fetchPriority="high" />
        </div>
        <div className="hero-copy">
          <h1>{content?.heroTitle || DEFAULT_HERO.title}</h1>
          <p>{content?.heroDescription || DEFAULT_HERO.text}</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-primary">Shop Collection <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <Section title="Featured For You" viewAllTo="/shop" tight={false}>
        <ProductGrid products={featuredProducts} emptyMessage={null} loading={featuredLoading} />
      </Section>

      <Section title="Hot Picks" viewAllTo="/shop?filter=hot">
        <ProductGrid products={hotProducts} showBadge loading={hotPicks.loading} />
      </Section>

      <Section title="Shop by Category">
        <div className="category-grid">
          {categories.loading && Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="category-tile category-tile-skeleton" aria-hidden="true" />
          ))}
          {!categories.loading && (categories.data ?? []).length === 0 && (
            <p className="empty-state">Categories will appear here once added in the admin panel.</p>
          )}
          {(categories.data ?? []).map((c) => (
            <Link key={c.id} className="category-tile" to={`/shop?category=${c.slug}`}>
              <img src={c.image || PLACEHOLDER.category} alt={c.name} loading="lazy" decoding="async" />
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="New Arrivals" viewAllTo="/shop?filter=new">
        <ProductGrid products={arrivalProducts} loading={newArrivals.loading} />
      </Section>

      <section className="section">
        <div className="container about-split">
          <img src={content?.aboutImage || PLACEHOLDER.about} alt="The woman behind the boutique" loading="lazy" decoding="async" />
          <div>
            <h2>Our Story</h2>
            <p>{content?.aboutText || DEFAULT_ABOUT_TEXT}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
