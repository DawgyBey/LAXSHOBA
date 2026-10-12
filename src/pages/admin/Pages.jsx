import { useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Field from '../../components/Field';
import { createPage, getAdminPages, removePage, updatePage } from '../../lib/data';

const EMPTY_PAGE = {
  name: '', slug: '', title: '', metaTitle: '', metaDescription: '', content: '', published: true,
};

const EXISTING_PAGES = [
  { name: 'Homepage', slug: 'home', title: 'Traditional elegance, chosen with love.', route: '/' },
  { name: 'Shop', slug: 'shop', title: 'Shop traditional wear', route: '/shop' },
  { name: 'About', slug: 'about', title: 'Our Story', route: '/about' },
  { name: 'Product detail', slug: 'product', title: 'Product detail page', route: '/product/:id' },
  { name: 'Cart', slug: 'cart', title: 'Your Cart', route: '/cart' },
  { name: 'Checkout', slug: 'checkout', title: 'Checkout', route: '/checkout' },
  { name: 'Login', slug: 'login', title: 'Welcome', route: '/login' },
  { name: 'Customer profile', slug: 'profile', title: 'My Account', route: '/profile' },
];

export default function Pages() {
  useDocumentTitle('Pages & SEO — Admin');
  const pages = useAsync(async () => getAdminPages());
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PAGE);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const bind = (key) => ({ value: form[key], onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })) });

  function openForm(page) {
    setEditingId(page?.id || null);
    setForm(page ? {
      name: page.name || '',
      slug: page.slug || '',
      title: page.title || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      content: page.content || '',
      published: page.published !== false,
    } : EMPTY_PAGE);
    setNotice(null);
    setFormOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const data = { ...form, name: form.name.trim(), slug: form.slug.trim().toLowerCase(), title: form.title.trim(), metaTitle: form.metaTitle.trim(), metaDescription: form.metaDescription.trim(), content: form.content.trim() };
    try {
      if (editingId) await updatePage(editingId, data);
      else await createPage(data);
      setFormOpen(false);
      pages.reload();
    } catch (error) {
      console.error('Saving page failed:', error);
      setNotice({ type: 'error', text: error.message || 'Could not save this page.' });
    }
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm('Delete this page? This cannot be undone.')) return;
    try {
      await removePage(id);
      pages.reload();
    } catch (error) {
      console.error('Deleting page failed:', error);
      setNotice({ type: 'error', text: error.message || 'Could not delete this page.' });
    }
  }

  const storedPages = pages.data ?? [];
  const storedSlugs = new Set(storedPages.map((page) => page.slug));
  const allPages = [
    ...EXISTING_PAGES.filter((page) => !storedSlugs.has(page.slug)),
    ...storedPages,
  ];

  return (
    <div>
      <h1>Pages & SEO</h1>

      {notice && <p className="admin-notice error" role="alert">{notice.text}</p>}

      {formOpen && <div className="admin-panel-box">
        <h3>{editingId ? 'Edit Page' : 'Add New Page'}</h3>
        <form onSubmit={save}>
          <div className="form-grid-2">
            <Field label="Page Name" type="text" required {...bind('name')} />
            <Field label="URL Slug" type="text" required placeholder="about-us" {...bind('slug')} />
            <Field label="Page Heading" type="text" required {...bind('title')} />
            <Field label="SEO Title" type="text" required maxLength="60" placeholder="Boutique About Us | Traditional Wear" {...bind('metaTitle')} />
          </div>
          <Field label="SEO Description" as="textarea" required maxLength="160" placeholder="A concise search result description, up to 160 characters." {...bind('metaDescription')} />
          <Field label="Page Content" as="textarea" style={{ minHeight: 180 }} placeholder="Write the page content here..." {...bind('content')} />
          <label className="admin-toggle"><input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} /> Published</label>
          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Page'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
          </div>
        </form>
      </div>}

      <div className="admin-panel-box">
        <h3>Existing Pages</h3>
        <p className="eyebrow-plain" style={{ marginBottom: 16 }}>Configure SEO metadata for every customer-facing route. Existing pages appear here automatically.</p>
        <table className="admin-table">
          <thead><tr><th>Page</th><th>Route</th><th>SEO title</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {!pages.loading && allPages.length === 0 && <tr><td colSpan="5">No CMS pages yet. Add your first page.</td></tr>}
            {allPages.map((page) => (
              <tr key={page.id || page.slug}>
                <td><strong>{page.name}</strong><br /><span className="eyebrow-plain">{page.title}</span></td>
                <td>{page.route || `/${page.slug}`}</td>
                <td>{page.metaTitle || 'Not set'}</td>
                <td>{page.id ? (page.published ? 'Published' : 'Draft') : 'Needs SEO'}</td>
                <td className="row-actions"><button className="btn btn-small btn-outline" onClick={() => openForm(page)}>Edit SEO</button>{page.id && <button className="btn btn-small btn-outline" onClick={() => remove(page.id)}>Delete</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}