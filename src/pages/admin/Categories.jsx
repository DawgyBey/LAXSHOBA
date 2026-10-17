import { useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Field from '../../components/Field';
import { createCategory, getAdminCategories, removeCategory } from '../../lib/data';
import { slugify } from '../../lib/format';
import { toast } from '../../lib/toast';

export default function Categories() {
  useDocumentTitle('Categories — Admin');

  const categories = useAsync(async () => getAdminCategories());
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');

  const list = categories.data ?? [];

  async function addCategory(e) {
    e.preventDefault();
    const trimmed = name.trim();
    try {
      await createCategory({ name: trimmed, slug: slugify(trimmed), parentId: parentId || null });
      setName('');
      setParentId('');
      categories.reload();
    } catch (err) {
      console.error('Adding category failed:', err);
      toast('Could not add this category. Please try again.', { tone: 'error' });
    }
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return;
    try {
      await removeCategory(id);
      categories.reload();
    } catch (err) {
      console.error('Delete failed:', err);
      toast('Could not delete this category. Please try again.', { tone: 'error' });
    }
  }

  return (
    <div>
      <h1>Categories</h1>

      <div className="admin-panel-box">
        <h3>Add Category</h3>
        <form onSubmit={addCategory}>
          <div className="form-grid-2">
            <Field label="Name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
            <Field label="Parent Category" as="select" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">None (main category)</option>
              {list.filter((c) => !c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Field>
          </div>
          <button type="submit" className="btn btn-primary">Add Category</button>
        </form>
        <p className="eyebrow-plain" style={{ marginTop: 10 }}>
          Leave "Parent Category" as None to create a main category (e.g. Sarees); choose a parent to create a subcategory (e.g. Silk Sarees under Sarees).
        </p>
      </div>

      <div className="admin-panel-box">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Slug</th><th>Actions</th></tr></thead>
          <tbody>
            {!categories.loading && list.length === 0 && <tr><td colSpan="3">No categories yet.</td></tr>}
            {list.map((c) => (
              <tr key={c.id}>
                <td>{c.parentId ? '— ' : ''}{c.name}</td>
                <td>{c.slug}</td>
                <td className="row-actions">
                  <button className="btn btn-small btn-outline" onClick={() => deleteCategory(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}