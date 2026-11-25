import { useMemo, useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Field from '../../components/Field';
import { COLORS, DEFAULT_CATEGORIES, FABRICS, OCCASIONS, PLACEHOLDER, SIZES } from '../../lib/constants';
import { createProduct, getAdminCategories, getAdminProducts, removeProduct, updateProduct } from '../../lib/data';
import { firstImage, formatPrice, splitList, formatProductName } from '../../lib/format';
import { toast } from '../../lib/toast';

const EMPTY_FORM = {
  name: '', category: '', price: '', salePrice: '', stock: '', fabric: '', description: '', review: '',
  sizes: '', colors: '', occasion: '',
  isHotPick: false, isFeatured: false, published: true,
};

function OptionPicker({ label, options, value, onToggle }) {
  const selected = splitList(value);
  return (
    <div className="field option-picker">
      <label>{label}</label>
      <div className="option-picker-grid">
        {options.map((option) => (
          <label key={option} className={selected.includes(option) ? 'option-choice selected' : 'option-choice'}>
            <input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Products() {
  useDocumentTitle('Products — Admin');

  const products = useAsync(async () => getAdminProducts());
  const categories = useAsync(async () => getAdminCategories());

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]); // Hosted image URLs for the product being edited
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState('all');

  const bind = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });
  const bindCheck = (key) => ({ checked: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.checked })) });
  const toggleOption = (key, option) => setForm((f) => {
    const selected = splitList(f[key]);
    const next = selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option];
    return { ...f, [key]: next.join(', ') };
  });

  function openForm(product) {
    setEditingId(product ? product.id : null);
    setImages(product?.images || []);
    setForm(product ? {
      name: product.name,
      category: product.categoryId || '',
      price: product.price ?? '',
      salePrice: product.salePrice || '',
      stock: product.stock ?? '',
      fabric: product.fabric || '',
      description: product.description || '',
      review: product.review || '',
      sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '),
      occasion: (product.occasion || []).join(', '),
      isHotPick: !!product.isHotPick,
      isFeatured: !!product.isFeatured,
      published: !!product.published,
    } : EMPTY_FORM);
    setFormOpen(true);
  }

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));
  function moveImage(i, delta) {
    setImages((prev) => {
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function saveProduct(e) {
    e.preventDefault();
    const category = categoryOptions.find((c) => c.id === form.category);
    const categorySlug = category?.slug || (form.category.startsWith('slug:') ? form.category.slice(5) : '');

    const data = {
      name: form.name.trim(),
      price: parseFloat(form.price) || 0,
      salePrice: parseFloat(form.salePrice) || null,
      stock: parseInt(form.stock, 10) || 0,
      description: form.description.trim(),
      review: form.review.trim(),
      fabric: form.fabric.trim(),
      categoryId: form.category,
      categorySlug,
      sizes: splitList(form.sizes),
      colors: splitList(form.colors),
      occasion: splitList(form.occasion),
      isHotPick: form.isHotPick,
      isFeatured: form.isFeatured,
      published: form.published,
      images,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, data);
      } else {
        await createProduct({ ...data, isNewArrival: true });
      }
      setFormOpen(false);
      products.reload();
    } catch (err) {
      console.error('Saving product failed:', err);
      toast('Could not save this product. Please try again.', { tone: 'error' });
    }
    setSaving(false);
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await removeProduct(id);
      products.reload();
    } catch (err) {
      console.error('Delete failed:', err);
      toast('Could not delete this product. Please try again.', { tone: 'error' });
    }
  }

  const list = products.data ?? [];
  const databaseCategories = categories.data ?? [];
  const databaseSlugs = new Set(databaseCategories.map((category) => category.slug));
  const categoryOptions = [
    ...databaseCategories,
    ...DEFAULT_CATEGORIES
      .filter((category) => !databaseSlugs.has(category.slug))
      .map(({ parentSlug, ...category }) => ({
        ...category,
        id: `slug:${category.slug}`,
        parentId: parentSlug ? `slug:${parentSlug}` : null,
      })),
  ];
  const visibleProducts = useMemo(() => list.filter((product) => {
    const matchesQuery = `${product.name} ${product.categorySlug || ''}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesVisibility = visibility === 'all' || (visibility === 'published' ? product.published !== false : product.published === false);
    return matchesQuery && matchesVisibility;
  }), [list, query, visibility]);
  const publishedCount = list.filter((product) => product.published !== false).length;
  const draftCount = list.length - publishedCount;

  return (
    <div className="products-page">
      <section className="page-intro products-intro">
        <div>
          <span className="section-kicker">Catalogue / inventory</span>
          <h1>Products</h1>
          <p>Keep your collection polished, stocked and ready to shop.</p>
        </div>
        <div className="products-heading-actions">
          <span className="products-count"><strong>{list.length}</strong> {list.length === 1 ? 'piece' : 'pieces'}</span>
          <button type="button" className="btn btn-primary" onClick={() => (formOpen ? setFormOpen(false) : openForm(null))}>{formOpen ? 'Close editor' : 'Add product'} {!formOpen && <span aria-hidden="true">＋</span>}</button>
        </div>
      </section>

      {formOpen && (
        <section className="admin-panel-box product-editor">
          <div className="product-editor-heading">
            <div>
              <span className="section-kicker">{editingId ? 'Edit catalogue entry' : 'New catalogue entry'}</span>
              <h2>{editingId ? 'Product details' : 'Add a product'}</h2>
            </div>
            <button type="button" className="product-editor-close" onClick={() => setFormOpen(false)} aria-label="Close product editor">×</button>
          </div>
          <form onSubmit={saveProduct}>
            <div className="form-grid-2">
              <Field label="Name" type="text" required {...bind('name')} />
              <Field label="Category" as="select" required {...bind('category')}>
                <option value="">Select category</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.parentId ? '— ' : ''}{c.name}</option>
                ))}
              </Field>
              <Field label="Price (Rs.)" type="number" required {...bind('price')} />
              <Field label="Sale Price (Rs., optional)" type="number" {...bind('salePrice')} />
              <Field label="Stock" type="number" required {...bind('stock')} />
              <Field label="Fabric" as="select" {...bind('fabric')}>
                <option value="">Select fabric</option>
                {FABRICS.map((fabric) => <option key={fabric} value={fabric}>{fabric}</option>)}
              </Field>
            </div>

            <Field label="Description" as="textarea" {...bind('description')} />
            <Field label="Review" as="textarea" placeholder="Add a short review / note for this product..." {...bind('review')} />

            <div className="form-grid-2">
              <OptionPicker label="Sizes" options={SIZES} value={form.sizes} onToggle={(option) => toggleOption('sizes', option)} />
              <OptionPicker label="Colors" options={COLORS} value={form.colors} onToggle={(option) => toggleOption('colors', option)} />
            </div>
            <OptionPicker label="Occasions" options={OCCASIONS} value={form.occasion} onToggle={(option) => toggleOption('occasion', option)} />

            <div className="field product-images-field">
              <div className="product-images-heading">
                <strong>Product images</strong>
                <span>{images.length} {images.length === 1 ? 'image' : 'images'} · first image is the cover</span>
              </div>
              <div className="image-upload-grid">
                {images.map((url, i) => (
                  <div className="thumb" key={`${url}-${i}`}>
                    <img src={url} alt="" />
                    <button type="button" className="remove-img" onClick={() => removeImage(i)} aria-label={`Remove image ${i + 1}`}>&times;</button>
                    <div className="reorder-btns">
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`}>&larr;</button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} aria-label={`Move image ${i + 1} later`}>&rarr;</button>
                    </div>
                  </div>
                ))}
              </div>
              {images.length === 0 && <p className="product-images-empty">Add hosted image URLs below to give this product a cover photo.</p>}
              <Field
                label="Image URLs (comma separated)"
                type="text"
                placeholder="https://…/front.jpg, https://…/back.jpg"
                value={images.join(', ')}
                onChange={(e) => setImages(e.target.value.split(',').map((url) => url.trim()).filter(Boolean))}
              />
            </div>

            <div className="checkbox-row">
              <label><input type="checkbox" {...bindCheck('isHotPick')} /> Mark as Hot Pick</label>
              <label><input type="checkbox" {...bindCheck('isFeatured')} /> Mark as Featured</label>
              <label><input type="checkbox" {...bindCheck('published')} /> Published</label>
            </div>

            <div className="product-editor-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-panel-box products-catalogue">
        <div className="products-toolbar">
          <div>
            <span className="section-kicker">Your collection</span>
            <h2>All products <span>{visibleProducts.length}</span></h2>
          </div>
          <label className="products-search">
            <span className="sr-only">Search products</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
          </label>
        </div>
        <div className="products-filter-row" role="group" aria-label="Filter products by visibility">
          {[['all', `All ${list.length}`], ['published', `Published ${publishedCount}`], ['draft', `Drafts ${draftCount}`]].map(([key, label]) => (
            <button key={key} type="button" className={visibility === key ? 'active' : ''} aria-pressed={visibility === key} onClick={() => setVisibility(key)}>{label}</button>
          ))}
        </div>
        {products.error && !products.loading && <div className="admin-notice error" role="alert">Products could not be loaded. <button type="button" onClick={products.reload}>Try again</button></div>}
        {products.loading && !products.data
          ? <p className="products-empty" role="status">Loading your collection…</p>
          : <div className="table-scroll products-table-scroll">
            <table className="admin-table products-table">
              <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Visibility</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {visibleProducts.length === 0 && <tr><td colSpan="5"><p className="products-empty">{list.length === 0 ? 'No products yet — add your first piece.' : 'No products match these filters.'}</p></td></tr>}
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <img className="product-list-image" src={firstImage(product, PLACEHOLDER.product)} alt="" loading="lazy" />
                        <div className="product-cell-copy">
                          <strong>{formatProductName(product.name)}</strong>
                          <span>{product.categorySlug ? formatProductName(product.categorySlug) : 'Uncategorised'}</span>
                        </div>
                      </div>
                    </td>
                    <td><strong>{formatPrice(product.salePrice || product.price)}</strong>{product.salePrice && product.price > product.salePrice && <span className="product-list-original">{formatPrice(product.price)}</span>}</td>
                    <td><span className={`product-stock${product.stock <= 3 ? ' is-low' : ''}`}>{product.stock ?? 0}<small>{product.stock <= 3 ? 'Low stock' : 'In stock'}</small></span></td>
                    <td><span className={`product-visibility${product.published === false ? ' is-draft' : ''}`}><i aria-hidden="true" />{product.published === false ? 'Draft' : 'Published'}</span></td>
                    <td className="products-row-actions">
                      <button type="button" className="btn btn-small btn-outline" onClick={() => openForm(product)}>Edit</button>
                      <button type="button" className="btn btn-small btn-outline" onClick={() => deleteProduct(product.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </section>
    </div>
  );
}