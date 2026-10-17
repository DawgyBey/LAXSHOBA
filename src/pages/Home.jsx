// Homepage. Products, categories and hero text all come from the API (the admin panel
// controls them). Only the section labels and trust copy live in the code.
import { Link } from 'react-router-dom';
import { useState } from 'react';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useHomepageContent from '../hooks/useHomepageContent';
import usePageSEO from '../hooks/usePageSEO';
import ProductGrid from '../components/ProductGrid';
import { api } from '../lib/api';
import {
  DEFAULT_ABOUT_TEXT, DEFAULT_HERO, DEFAULT_HERO_IMAGE, DEMO_PRODUCTS,
  OCCASIONS, OCCASION_STYLES, PLACEHOLDER, TRUST_POINTS,
} from '../lib/constants';
import { getCategories, getProduct, getProducts } from '../lib/data';
import { discountPercent } from '../lib/format';

const ICONS = {
  cod: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6.5 9.5v.01M17.5 14.5v.01" /></>,
  track: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></>,
  hand: <path d="M12 20.5s-7.5-4.6-7.5-10A4.4 4.4 0 0 1 12 7.8a4.4 4.4 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10Z" />,
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
};

function Section({ title, note, viewAllTo, children }) {
  return (
    <section className="sf-section">
      <div className="container">
        <div className="sec-head">
          <div>
            <h2>{title}</h2>
            {note && <p>{note}</p>}
          </div>
          {viewAllTo && <Link className="sec-link" to={viewAllTo}>View all</Link>}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  useDocumentTitle('LAXSHOBHA — Draped in Beauty');
  usePageSEO('home', 'LAXSHOBHA — Draped in Beauty', 'Traditional sarees, kurtas, and festive wear chosen with care.');
  const content = useHomepageContent();
  const homepageReady = content !== null;

  const categories = useAsync(async () =>
    (await getCategories()).filter((category) => !category.parentId).slice(0, 8));

  // One catalog request feeds sale, hot picks and new arrivals.
  const products = useAsync(async () => getProducts(true));
  const catalog = products.loading ? [] : (products.data?.length ? products.data : DEMO_PRODUCTS);
  const saleProducts = catalog.filter((p) => discountPercent(p) > 0);
  const hotProducts = catalog.filter((p) => p.isHotPick).slice(0, 8);
  const arrivals = catalog.slice(0, 8);

  // "Featured For You" is a hand-picked list of product ids stored on the homepage document.
  const featuredIds = content?.featuredProductIds;
  const featured = useAsync(async () => {
    if (!homepageReady) return [];
    if (!featuredIds || featuredIds.length === 0) return [];
    const picked = await Promise.all(featuredIds.slice(0, 8).map((id) => getProduct(id).catch(() => null)));
    return picked.filter(Boolean);
  }, [homepageReady, featuredIds]);
  const featuredLoading = !homepageReady || featured.loading;
  const featuredProducts = featured.data?.length ? featured.data : DEMO_PRODUCTS.slice(0, 4);

  async function subscribeToNewsletter(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get('email');
    setNewsletterSubmitting(true);
    setNewsletterStatus('');
    try {
      await api.post('/newsletter', { email });
      setNewsletterStatus('You’re on the list. Watch your inbox for our next note.');
      form.reset();
    } catch (error) {
      setNewsletterStatus(error.message || 'We couldn’t add you just now. Please try again.');
    } finally {
      setNewsletterSubmitting(false);
    }
  }

  return (
    <main className="home-page">
      <section className="sf-hero">
        <div className="container sf-hero-grid">
          <div className="sf-hero-copy">
            <p className="sf-hero-kicker">The new collection</p>
            <h1 className="text-balance">{content?.heroTitle || DEFAULT_HERO.title}</h1>
            <p className="sf-hero-text">{content?.heroDescription || DEFAULT_HERO.text}</p>
            <div className="sf-hero-actions">
              <Link to="/shop?filter=new" className="btn btn-ghost-light">Discover the collection</Link>
            </div>
          </div>

          <div className="sf-hero-media">
            <div className="sf-arch">
              <img src={content?.heroImage || DEFAULT_HERO_IMAGE || PLACEHOLDER.hero} alt="From the latest Laxshobha collection" fetchPriority="high" />
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Why shop with us">
        <ul className="container">
          {TRUST_POINTS.map((point) => (
            <li key={point.title}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[point.icon]}</svg>
              <div><strong>{point.title}</strong><span>{point.text}</span></div>
            </li>
          ))}
        </ul>
      </section>

      <Section title="Shop by category">
        <div className="cat-grid">
          {categories.loading && Array.from({ length: 4 }, (_, i) => <div key={i} className="cat-tile cat-tile-skeleton" aria-hidden="true" />)}
          {!categories.loading && (categories.data ?? []).length === 0 && (
            <p className="empty-state">Categories will appear here once added in the admin panel.</p>
          )}
          {(categories.data ?? []).map((c) => (
            <Link key={c.id} className="cat-tile" to={`/shop?category=${c.slug}`}>
              <span className="cat-tile-img"><img src={c.image || PLACEHOLDER.category} alt="" loading="lazy" decoding="async" /></span>
              <span className="cat-tile-name">{c.name}</span>
            </Link>
          ))}
        </div>
      </Section>

      {saleProducts.length > 0 && (
        <section className="sale-band">
          <div className="container">
            <div className="sec-head">
              <div>
                <h2>The Sale</h2>
                <p>Selected pieces at considered prices, while stock lasts.</p>
              </div>
              <Link className="sec-link" to="/shop?filter=sale">View all</Link>
            </div>
            <ProductGrid products={saleProducts.slice(0, 4)} skeletonCount={4} />
          </div>
        </section>
      )}

      <Section title="Featured for you" viewAllTo="/shop">
        <ProductGrid products={featuredProducts} emptyMessage={null} loading={featuredLoading} showBadge />
      </Section>

      {(products.loading || hotProducts.length > 0) && (
        <Section title="Trending now" note="The pieces everyone is adding to their bag." viewAllTo="/shop?filter=hot">
          <ProductGrid products={hotProducts} showBadge loading={products.loading} />
        </Section>
      )}

      <Section title="Shop by occasion">
        <div className="occasion-grid">
          {OCCASIONS.map((name) => (
            <Link key={name} className="occasion-tile" to={`/shop?occasion=${name}`}>
              <img src={OCCASION_STYLES[name]?.image} alt="" loading="lazy" decoding="async" style={{ objectPosition: OCCASION_STYLES[name]?.position }} />
              <span className="occasion-text">
                <strong>{name}</strong>
                <span>{OCCASION_STYLES[name]?.note}</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="New arrivals" viewAllTo="/shop?filter=new">
        <ProductGrid products={arrivals} showBadge loading={products.loading} />
      </Section>

      <section className="newsletter-band">
        <div className="container newsletter-band-inner">
          <div>
            <h2>The Laxshobha Letter</h2>
            <p>Fresh finds and thoughtful styling, delivered occasionally.</p>
          </div>
          <form className="newsletter-band-form" onSubmit={subscribeToNewsletter}>
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="Your email address" maxLength={254} required />
            <button className="link-arrow" type="submit" disabled={newsletterSubmitting}>
              {newsletterSubmitting ? 'Joining' : 'Join'} <span aria-hidden="true">→</span>
            </button>
            <p className="newsletter-status" aria-live="polite">{newsletterStatus}</p>
          </form>
        </div>
      </section>

      <section className="sf-section story-section">
        <div className="container about-split">
          <div className="story-photo"><img src={content?.aboutImage || '/photos/blush-pink-flatlay.jpg'} alt="The founder of Laxshobha" loading="lazy" decoding="async" /></div>
          <div>
            <h2>Our story</h2>
            <p>{content?.aboutText || DEFAULT_ABOUT_TEXT}</p>
            <Link to="/about" className="link-arrow">Read more about us <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
