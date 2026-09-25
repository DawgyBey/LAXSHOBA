import { useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Field from '../../components/Field';
import { COLORS, DEFAULT_CATEGORIES, FABRICS, OCCASIONS, PLACEHOLDER, SIZES } from '../../lib/constants';
import { createProduct, getAdminCategories, getAdminProducts, removeProduct, updateProduct } from '../../lib/data';
import { firstImage, formatPrice, splitList } from '../../lib/format';

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
      alert('Could not save this product. Please try again.');
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
      alert('Could not delete this product. Please try again.');
    }
  }

  const list = products.data ?? [];
  const databaseCategories = categories.data ?? [];
  const databaseSlugs = new Set(databaseCategories.map((category) => category.slug));
  const categoryOptions = [
    ...databaseCategories,
    ...DEFAULT_CATEGORIES
      .filter((category) => !databaseSlugs.has(category.slug))
      .map((category) => ({ ...category, id: `slug:${category.slug}`, parentId: null })),
  ];

  return (
    <>
      <div className="admin-topbar">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={() => openForm(null)}>Add Product</button>
      </div>

      {formOpen && (
        <div className="admin-panel-box">
          <h3>Product Details</h3>
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

            <div className="field">
              <label htmlFor="product-images">Product Images</label>
              <div className="image-upload-grid">
                {images.map((url, i) => (
                  <div className="thumb" key={url}>
                    <img src={url} alt="" />
                    <button type="button" className="remove-img" onClick={() => removeImage(i)}>&times;</button>
                    <div className="reorder-btns">
                      <button type="button" onClick={() => moveImage(i, -1)}>&larr;</button>
                      <button type="button" onClick={() => moveImage(i, 1)}>&rarr;</button>
                    </div>
                  </div>
                ))}
              </div>
              <Field
                label="Image URLs (comma separated)"
                type="text"
                value={images.join(', ')}
                onChange={(e) => setImages(e.target.value.split(',').map((url) => url.trim()).filter(Boolean))}
              />
            </div>

            <div className="checkbox-row">
              <label><input type="checkbox" {...bindCheck('isHotPick')} /> Mark as Hot Pick</label>
              <label><input type="checkbox" {...bindCheck('isFeatured')} /> Mark as Featured</label>
              <label><input type="checkbox" {...bindCheck('published')} /> Published</label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-panel-box">
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {!products.loading && list.length === 0 && <tr><td colSpan="6">No products yet — add your first one.</td></tr>}
            {list.map((p) => (
              <tr key={p.id}>
                <td><img src={firstImage(p, PLACEHOLDER.product)} alt="" /></td>
                <td>{p.name}</td>
                <td>{formatPrice(p.salePrice || p.price)}</td>
                <td>{p.stock}</td>
                <td>{p.published ? 'Published' : 'Draft'}</td>
                <td className="row-actions">
                  <button className="btn btn-small btn-outline" onClick={() => openForm(p)}>Edit</button>
                  <button className="btn btn-small btn-outline" onClick={() => deleteProduct(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
