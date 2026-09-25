// Homepage & Settings: hero, about text/image and the hand-picked "Featured For You" list.
import { useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useHomepageContent from '../../hooks/useHomepageContent';
import Field from '../../components/Field';
import Loading from '../../components/Loading';
import { getAdminProducts, saveHomepage } from '../../lib/data';

function ImageField({ label, id, value, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" placeholder="Hosted image URL" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SettingsForm({ initial, products }) {
  const [form, setForm] = useState({
    heroTitle: initial.heroTitle || '',
    heroDescription: initial.heroDescription || '',
    heroImage: initial.heroImage || '',
    aboutText: initial.aboutText || '',
    aboutImage: initial.aboutImage || '',
  });
  const [featuredIds, setFeaturedIds] = useState(initial.featuredProductIds || []);
  const [saving, setSaving] = useState(false);

  const bind = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });
  const bindImage = (key) => ({ value: form[key], onChange: (url) => setForm((f) => ({ ...f, [key]: url })) });
  const toggleFeatured = (id) =>
    setFeaturedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

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
      });
      alert('Homepage updated.');
    } catch (err) {
      console.error('Saving homepage failed:', err);
      alert('Could not save the homepage. Please try again.');
    }
    setSaving(false);
  }

  return (
    <form onSubmit={save}>
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
          {products.map((p) => (
            <label key={p.id} className="filter-option">
              <input type="checkbox" checked={featuredIds.includes(p.id)} onChange={() => toggleFeatured(p.id)} /> {p.name}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Homepage'}</button>
    </form>
  );
}

export default function Settings() {
  useDocumentTitle('Homepage & Settings — Admin');
  const content = useHomepageContent();
  const products = useAsync(async () => getAdminProducts());

  return (
    <>
      <div className="admin-topbar"><h1>Homepage & Settings</h1></div>
      {content === null || products.loading
        ? <Loading />
        : <SettingsForm initial={content} products={products.data ?? []} />}
    </>
  );
}
