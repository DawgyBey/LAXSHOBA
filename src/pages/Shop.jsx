// Shop page. Reads all published products once, then filters/sorts client-side —
// simplest approach for a catalog this size, no server needed.
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ProductGrid from '../components/ProductGrid';
import { COLORS, OCCASIONS, SIZES } from '../lib/constants';
import { getCategories, getProducts } from '../lib/data';
import { DEMO_PRODUCTS } from '../lib/constants';
import { effectivePrice } from '../lib/format';

const EMPTY_CATEGORIES = [];
const NO_FILTERS = {
  search: '', priceMin: '', priceMax: '',
  categories: [], sizes: [], colors: [], occasions: [],
  hotOnly: false, sort: 'newest',
};

// The catalog is fetched in one read (it's just text + URLs, cheap), but rendering
// every matching product's image at once is what was slowing the page down — that's
// however many products you have, all requesting photos at the same time. Showing
// a page at a time keeps the grid to a manageable number of images per screen.
const PAGE_SIZE = 24;

// Pre-set filters from ?category= or ?filter= in the URL (used by the header nav links).
function filtersFromParams(params, categories) {
  const filters = { ...NO_FILTERS };
  const category = params.get('category');
  if (category && categories.some((c) => c.slug === category)) filters.categories = [category];
  if (params.get('filter') === 'hot') filters.hotOnly = true;
  return filters;
}

function applyFilters(products, f) {
  const search = f.search.trim().toLowerCase();
  const min = parseFloat(f.priceMin) || 0;
  const max = parseFloat(f.priceMax) || Infinity;

  const results = products.filter((p) => {
    const price = effectivePrice(p);
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (price < min || price > max) return false;
    if (f.hotOnly && !p.isHotPick) return false;
    if (f.categories.length && !f.categories.includes(p.categorySlug)) return false;
    if (f.sizes.length && !(p.sizes || []).some((s) => f.sizes.includes(s))) return false;
    if (f.colors.length && !(p.colors || []).some((c) => f.colors.includes(c))) return false;
    if (f.occasions.length && !(p.occasion || []).some((o) => f.occasions.includes(o))) return false;
    return true;
  });

  const sorted = [...results];
  if (f.sort === 'price-low') sorted.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  if (f.sort === 'price-high') sorted.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  if (f.sort === 'newest') sorted.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  if (f.sort === 'popular') sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  return sorted;
}

function CheckboxGroup({ title, options, selected, onToggle }) {
  return (
    <>
      <h4>{title}</h4>
      {options.map((o) => {
        const { value, label } = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <label key={value} className="filter-option">
            <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} /> {label}
          </label>
        );
      })}
    </>
  );
}

function ShopContent({ products, categories, loading = false }) {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const [filters, setFilters] = useState(() => filtersFromParams(params, categories));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setFilters(filtersFromParams(params, categories));
  }, [query, categories, params]);

  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const toggle = (key, value) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  function clearFilters() {
    setFilters(NO_FILTERS);
    if (params.toString()) setParams({}, { replace: true });
  }

  const results = useMemo(() => applyFilters(products, filters), [products, filters]);
  // Any change to the filters starts back at one page's worth of images.
  useEffect(() => setVisibleCount(PAGE_SIZE), [filters]);
  const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);
  const mainCategories = categories.filter((c) => !c.parentId).map((c) => ({ value: c.slug, label: c.name }));

  return (
    <section className="section">
      <div className="container">
        <h1 style={{ marginBottom: 28 }}>Shop</h1>

        <div className="shop-layout">
          <aside className="filter-panel">
            <h4>Search</h4>
            <div className="field">
              <input type="text" placeholder="Search products" value={filters.search} onChange={(e) => set('search', e.target.value)} />
            </div>

            <CheckboxGroup title="Category" options={mainCategories} selected={filters.categories} onToggle={(v) => toggle('categories', v)} />

            <h4>Price</h4>
            <div className="price-range">
              <input type="number" placeholder="Min" value={filters.priceMin} onChange={(e) => set('priceMin', e.target.value)} />
              <span>–</span>
              <input type="number" placeholder="Max" value={filters.priceMax} onChange={(e) => set('priceMax', e.target.value)} />
            </div>

            <CheckboxGroup title="Size" options={SIZES} selected={filters.sizes} onToggle={(v) => toggle('sizes', v)} />
            <CheckboxGroup title="Color" options={COLORS} selected={filters.colors} onToggle={(v) => toggle('colors', v)} />
            <CheckboxGroup title="Occasion" options={OCCASIONS} selected={filters.occasions} onToggle={(v) => toggle('occasions', v)} />

            <h4>Other</h4>
            <label className="filter-option">
              <input type="checkbox" checked={filters.hotOnly} onChange={(e) => set('hotOnly', e.target.checked)} /> Hot Picks only
            </label>

            <div style={{ marginTop: 24 }}>
              <button className="btn btn-outline btn-small" onClick={clearFilters}>Clear filters</button>
            </div>
          </aside>

          <div>
            <div className="shop-toolbar">
              <span className="result-count">
                {visibleResults.length === results.length
                  ? `${results.length} item${results.length === 1 ? '' : 's'}`
                  : `${visibleResults.length} of ${results.length} items`}
              </span>
              <select value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
            <ProductGrid
              products={visibleResults}
              emptyMessage="No products match those filters."
              showBadge
              loading={loading}
            />
            {visibleCount < results.length && !loading && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button className="btn btn-outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Load more ({results.length - visibleCount} more)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Shop() {
  useDocumentTitle('Shop — LAXSHOBHA');

  const products = useAsync(async () =>
    getProducts(true));
  const categories = useAsync(async () => getCategories());

  const catalog = products.loading
    ? []
    : (products.data?.length ? products.data : DEMO_PRODUCTS);

  return (
    <ShopContent
      products={catalog}
      categories={categories.data ?? EMPTY_CATEGORIES}
      loading={products.loading || categories.loading}
    />
  );
}
