// Homepage & Settings: hero, about text/image and the hand-picked "Featured For You" list.
import { useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useHomepageContent from '../../hooks/useHomepageContent';
import { getAdminProducts, saveHomepage } from '../../lib/data';
import Field from '../../components/Field';
import Loading from '../../components/Loading';
import { toast } from '../../lib/toast';

function ImageField({ label, id, value, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" placeholder="Hosted image URL" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function Settings() {
  useDocumentTitle('Homepage & Settings — Admin');
  const content = useHomepageContent();
  const products = useAsync(async () => getAdminProducts());

  const [form, setForm] = useState({
    heroTitle: content?.heroTitle || '',
    heroDescription: content?.heroDescription || '',
    heroImage: content?.heroImage || '',
    aboutText: content?.aboutText || '',
    aboutImage: content?.aboutImage || '',
    scanTitle: content?.scanTitle || '',
    scanDescription: content?.scanDescription || '',
  });
  const [featuredIds, setFeaturedIds] = useState(content?.featuredProductIds || []);
  const [scanProductIds, setScanProductIds] = useState(content?.scanProductIds || []);
  const [saving, setSaving] = useState(false);

  const bind = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });
  const bindImage = (key) => ({ value: form[key], onChange: (url) => setForm((f) => ({ ...f, [key]: url })) });
  const toggleFeatured = (id) =>
    setFeaturedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const toggleScanProduct = (id) =>
    setScanProductIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < 12 ? [...ids, id] : ids));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveHomepage({
        heroTitle: form.heroTitle.trim(),
        heroDescription: form.heroDescription.trim(),
        heroImage: form.heroImage.trim(),
        aboutText: form.aboutText.trim(),
        aboutImage: form.aboutImage.trim(),
        featuredProductIds: featuredIds,
        scanTitle: form.scanTitle.trim(),
        scanDescription: form.scanDescription.trim(),
        scanProductIds,
      });
      toast('Homepage updated.');
    } catch (err) {
      console.error('Saving homepage failed:', err);
      toast('Could not save the homepage. Please try again.', { tone: 'error' });
    }
    setSaving(false);
  }

  return (
    <div>
      <h1>Homepage & Settings</h1>

      {content === null || products.loading
        ? <Loading />
        : <form onSubmit={save}>
          <div className="admin-panel-box">
            <h3>Hero Section</h3>
            <Field label="Hero Title" type="text" {...bind('heroTitle')} />
            <Field label="Hero Description" as="textarea" {...bind('heroDescription')} />
            <ImageField label="Hero Image" id="hero-image" {...bindImage('heroImage')} />
          </div>

          <div className="admin-panel-box">
            <h3>About / Brand Story</h3>
            <Field label="About Text" as="textarea" {...bind('aboutText')} />
            <ImageField label="About Image" id="about-image" {...bindImage('aboutImage')} />
          </div>

          <div className="admin-panel-box">
            <h3>Featured For You</h3>
            <p className="eyebrow-plain" style={{ marginBottom: 12 }}>
              Choose which products show in the homepage's "Featured For You" section.
            </p>
            <div>
              {products.data?.map((p) => (
                <label key={p.id} className="filter-option">
                  <input type="checkbox" checked={featuredIds.includes(p.id)} onChange={() => toggleFeatured(p.id)} /> {p.name}
                </label>
              ))}
            </div>
          </div>

          <div className="admin-panel-box">
            <h3>QR Quick Picks</h3>
            <p className="eyebrow-plain" style={{ marginBottom: 12 }}>
              Choose up to 12 products for the page customers see after scanning your shop QR. With no products selected, it shows Hot Picks or the newest products.
            </p>
            <Field label="Page Title" type="text" placeholder="Latest & Loved" {...bind('scanTitle')} />
            <Field label="Short Introduction" as="textarea" placeholder="A few beautiful finds, chosen for you." {...bind('scanDescription')} />
            <div>
              {products.data?.map((product) => (
                <label key={product.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={scanProductIds.includes(product.id)}
                    disabled={!scanProductIds.includes(product.id) && scanProductIds.length >= 12}
                    onChange={() => toggleScanProduct(product.id)}
                  /> {product.name}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Homepage'}</button>
        </form>}
    </div>
  );
}