// Shop page. Reads all published products once, then filters/sorts client-side —
// simplest approach for a catalog this size, no server needed.
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ProductGrid from '../components/ProductGrid';
import { COLORS, OCCASIONS, SIZES } from '../lib/constants';
import { getCategories, getProducts } from '../lib/data';
import { DEMO_PRODUCTS } from '../lib/constants';
import { discountPercent, effectivePrice } from '../lib/format';

const EMPTY_CATEGORIES = [];
const NO_FILTERS = {
  search: '', priceMin: '', priceMax: '',
  categories: [], sizes: [], colors: [], occasions: [],
  hotOnly: false, saleOnly: false, sort: 'newest',
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
  if (params.get('filter') === 'sale') filters.saleOnly = true;
  const occasion = params.get('occasion');
  if (occasion && OCCASIONS.includes(occasion)) filters.occasions = [occasion];
  const q = params.get('q');
  if (q) filters.search = q;
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
    if (f.saleOnly && discountPercent(p) === 0) return false;
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
  const activeFilters = [
    ...(filters.search ? [{ key: 'search', value: filters.search, label: `Search: ${filters.search}` }] : []),
    ...filters.categories.map((value) => ({ key: 'categories', value, label: mainCategories.find((category) => category.value === value)?.label || value })),
    ...filters.sizes.map((value) => ({ key: 'sizes', value, label: `Size: ${value}` })),
    ...filters.colors.map((value) => ({ key: 'colors', value, label: `Color: ${value}` })),
    ...filters.occasions.map((value) => ({ key: 'occasions', value, label: value })),
    ...(filters.priceMin ? [{ key: 'priceMin', value: filters.priceMin, label: `From ${filters.priceMin}` }] : []),
    ...(filters.priceMax ? [{ key: 'priceMax', value: filters.priceMax, label: `Up to ${filters.priceMax}` }] : []),
    ...(filters.hotOnly ? [{ key: 'hotOnly', value: true, label: 'Hot picks' }] : []),
    ...(filters.saleOnly ? [{ key: 'saleOnly', value: true, label: 'On sale' }] : []),
  ];

  function removeFilter(key, value) {
    if (['categories', 'sizes', 'colors', 'occasions'].includes(key)) {
      set(key, filters[key].filter((selected) => selected !== value));
      return;
    }
    set(key, key === 'hotOnly' || key === 'saleOnly' ? false : '');
  }

  return (
    <section className="section">
      <div className="container">
        <div className="shop-heading">
          <div>
            <h1>{filters.saleOnly ? 'The sale' : filters.search ? `Results for “${filters.search}”` : 'Shop all pieces'}</h1>
            <p>{filters.saleOnly ? 'Selected pieces at lower prices.' : 'Sarees, kurtas and festive wear, chosen with care.'}</p>
          </div>
        </div>

        {mainCategories.length > 0 && (
          <div className="pill-rail" role="group" aria-label="Quick categories">
            <button type="button" className={`pill${filters.categories.length === 0 ? ' active' : ''}`} onClick={() => set('categories', [])}>All</button>
            {mainCategories.map((c) => (
              <button type="button" key={c.value} className={`pill${filters.categories.includes(c.value) ? ' active' : ''}`} onClick={() => set('categories', filters.categories.includes(c.value) ? [] : [c.value])}>{c.label}</button>
            ))}
          </div>
        )}

        <div className="shop-layout">
          <button className="filter-toggle" type="button" aria-expanded={mobileFiltersOpen} aria-controls="shop-filters" onClick={() => setMobileFiltersOpen((open) => !open)}>
            <span>{mobileFiltersOpen ? 'Hide filters' : 'Filters'}</span><span className="filter-toggle-count">{activeFilters.length || '＋'}</span>
          </button>
          <aside id="shop-filters" className={`filter-panel${mobileFiltersOpen ? ' is-open' : ''}`}>
            <div className="filter-panel-head"><h2>Refine</h2><button type="button" onClick={clearFilters}>Reset all</button></div>
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
            <label className="filter-option">
              <input type="checkbox" checked={filters.saleOnly} onChange={(e) => set('saleOnly', e.target.checked)} /> On sale
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
            {activeFilters.length > 0 && <div className="active-filters" aria-label="Active filters">
              {activeFilters.map((filter) => <button type="button" className="filter-chip" key={`${filter.key}-${filter.value}`} onClick={() => removeFilter(filter.key, filter.value)}>{filter.label}<span aria-hidden="true">×</span></button>)}
              <button type="button" className="clear-active-filters" onClick={clearFilters}>Clear all</button>
            </div>}
            <ProductGrid
              products={visibleResults}
              emptyMessage="No products match those filters."
              showBadge
              loading={loading}
            />
            {visibleCount < results.length && !loading && (
              <div className="load-more-wrap">
                <button className="btn btn-outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Load more ({results.length - visibleCount} more)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {mobileFiltersOpen && <motion.button className="filter-dismiss" type="button" aria-label="Close filters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileFiltersOpen(false)} />}
      </AnimatePresence>
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
