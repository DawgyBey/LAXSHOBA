// Profile page: personal info, order history, wishlist, saved addresses.
// All four tabs read/write real data tied to the signed-in user through the API.
// (Route is wrapped in <RequireAuth>, so `user` is always set here.)
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Field from '../components/Field';
import ProductGrid from '../components/ProductGrid';
import { PLACEHOLDER } from '../lib/constants';
import { getAddresses, getOrders, getWishlist, removeAddress as removeAddressRequest, saveAddress, updateProfile } from '../lib/data';
import { formatDate, formatPrice, shortOrderId } from '../lib/format';
import { resizeImageFile } from '../lib/image';

const TABS = [
  { id: 'info', label: 'Personal Information' },
  { id: 'orders', label: 'Orders' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'addresses', label: 'Addresses' },
];

function PersonalInfoTab({ user, updateUser }) {
  const profile = useAsync(async () => user, [user]);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [cropSource, setCropSource] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(50);
  const cropImage = useRef(null);

  useEffect(() => () => { if (cropSource) URL.revokeObjectURL(cropSource); }, [cropSource]);

  // Fill the form once the profile document has loaded.
  useEffect(() => {
    if (profile.loading) return;
    const p = profile.data || {};
    setForm({ name: p.name || user.name || '', phone: p.phone || '' });
  }, [profile.loading, profile.data, user.name]);

  async function save() {
    if (!form.name.trim() || !form.phone.trim()) { setNotice({ type: 'error', text: 'Name and phone are required.' }); return; }
    setSaving(true);
    setNotice(null);
    try {
      const result = await updateProfile({ name: form.name.trim(), phone: form.phone.trim(), photoURL: profile.data?.photoURL || user.photoURL || '' });
      updateUser(result.user);
      setNotice({ type: 'success', text: 'Personal details saved.' });
    } catch (err) {
      console.error('Saving profile failed:', err);
      setNotice({ type: 'error', text: err.message || 'Could not save your changes. Please try again.' });
    }
    setSaving(false);
  }

  async function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setNotice({ type: 'error', text: 'Please choose an image file.' }); return; }
    const resized = await resizeImageFile(file, { maxDimension: 1200, quality: 0.86 });
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(URL.createObjectURL(resized));
    setCropZoom(1);
    setCropX(50);
    setCropY(50);
    event.target.value = '';
  }

  function cancelCrop() {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
  }

  async function saveCroppedPhoto() {
    if (!cropImage.current || !cropSource) return;
    setSaving(true);
    setNotice(null);
    try {
      const image = cropImage.current;
      const size = 640;
      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * cropZoom;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, (size - width) * cropX / 100, (size - height) * cropY / 100, width, height);
      const photoURL = canvas.toDataURL('image/jpeg', 0.84);
      const result = await updateProfile({ name: form.name.trim(), phone: form.phone.trim(), photoURL });
      updateUser(result.user);
      cancelCrop();
      setNotice({ type: 'success', text: 'Profile picture updated.' });
    } catch (err) {
      console.error('Updating profile picture failed:', err);
      setNotice({ type: 'error', text: 'Could not update your profile picture. Please try again.' });
    }
    setSaving(false);
  }

  const p = profile.data || {};
  return (
    <div className="profile-panel">
      <p className="profile-required-note">Keep your contact details up to date so we can reach you about delivery.</p>
      {notice && <p className={`profile-notice ${notice.type}`} role="status">{notice.text}</p>}
      <div className="profile-avatar-editor">
        <img src={p.photoURL || user.photoURL || PLACEHOLDER.avatar} alt="Profile" className="profile-avatar" />
        <label className="btn btn-outline btn-small">Change picture<input type="file" accept="image/*" onChange={choosePhoto} /></label>
      </div>
      {cropSource && <div className="crop-editor" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <div className="crop-editor-head">
          <div><span className="eyebrow">Profile picture</span><h3 id="crop-title">Crop your picture</h3></div>
          <button className="crop-close" type="button" onClick={cancelCrop} aria-label="Cancel crop">×</button>
        </div>
        <div className="crop-preview"><img ref={cropImage} src={cropSource} alt="Crop preview" style={{ objectPosition: `${cropX}% ${cropY}%`, transform: `scale(${cropZoom})` }} /></div>
        <label className="crop-control">Zoom <input type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} /></label>
        <label className="crop-control">Horizontal position <input type="range" min="0" max="100" value={cropX} onChange={(e) => setCropX(Number(e.target.value))} /></label>
        <label className="crop-control">Vertical position <input type="range" min="0" max="100" value={cropY} onChange={(e) => setCropY(Number(e.target.value))} /></label>
        <div className="crop-actions"><button className="btn btn-outline" type="button" onClick={cancelCrop}>Cancel</button><button className="btn btn-primary" type="button" onClick={saveCroppedPhoto} disabled={saving}>{saving ? 'Saving...' : 'Use this picture'}</button></div>
      </div>}
      <Field label="Name *" type="text" required style={{ maxWidth: 400 }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Field label="Email *" type="email" required style={{ maxWidth: 400 }} value={p.email || user.email || ''} disabled readOnly />
      <Field label="Phone *" type="tel" required style={{ maxWidth: 400 }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
    </div>
  );
}

function OrdersTab({ user }) {
  const orders = useAsync(async () =>
    getOrders(), [user.id]);

  return (
    <div className="profile-panel">
      {!orders.loading && (orders.data ?? []).length === 0 && <p className="empty-state">No orders yet.</p>}
      {(orders.data ?? []).map((o) => (
        <div className="order-row" key={o.id}>
          <div className="order-row-head">
            <span>Order {shortOrderId(o.id)} · {formatDate(o.createdAt)}</span>
            <span className="status-pill">{o.status}</span>
          </div>
          <p className="eyebrow-plain">{o.items.length} item(s) · {formatPrice(o.total)}</p>
        </div>
      ))}
    </div>
  );
}

function WishlistTab({ user }) {
  const wishlist = useAsync(async () => {
    return getWishlist();
  }, [user.id]);

  return (
    <div className="profile-panel">
      {!wishlist.loading && <ProductGrid products={wishlist.data ?? []} emptyMessage="Nothing saved yet." />}
    </div>
  );
}

function AddressesTab({ user }) {
  const addresses = useAsync(async () =>
    getAddresses(), [user.id]);
  const [form, setForm] = useState({ label: '', street: '', city: '', phone: '' });
  const [notice, setNotice] = useState(null);
  const bind = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });

  async function addAddress() {
    const street = form.street.trim();
    const city = form.city.trim();
    const phone = form.phone.trim();
    if (!street || !city || !phone) { setNotice({ type: 'error', text: 'Street, city, and phone are required.' }); return; }

    try {
      setNotice(null);
      await saveAddress({ label: form.label.trim() || 'Home', street, city, phone });
      setForm({ label: '', street: '', city: '', phone: '' });
      addresses.reload();
      setNotice({ type: 'success', text: 'Address saved successfully.' });
    } catch (err) {
      console.error('Saving address failed:', err);
      setNotice({ type: 'error', text: err.message || 'Could not save that address. Please try again.' });
    }
  }

  async function removeAddress(id) {
    try {
      await removeAddressRequest(id);
      addresses.reload();
    } catch (err) {
      console.error('Removing address failed:', err);
      alert('Could not remove that address. Please try again.');
    }
  }

  const list = addresses.data ?? [];
  return (
    <div className="profile-panel">
      <div style={{ marginBottom: 32 }}>
        {!addresses.loading && list.length === 0 && <p className="empty-state">No saved addresses.</p>}
        {list.map((a) => (
          <div className="address-row" key={a.id}>
            <strong>{a.label}</strong>
            <p className="eyebrow-plain">{a.street}, {a.city} · {a.phone}</p>
            <button className="btn btn-outline btn-small" style={{ marginTop: 10 }} onClick={() => removeAddress(a.id)}>Remove</button>
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: 16 }}>Add New Address</h3>
      {notice && <p className={`profile-notice ${notice.type}`} role="status">{notice.text}</p>}
      <Field label="Label (optional)" type="text" style={{ maxWidth: 400 }} {...bind('label')} />
      <Field label="Street Address *" type="text" required style={{ maxWidth: 400 }} {...bind('street')} />
      <Field label="City *" type="text" required style={{ maxWidth: 400 }} {...bind('city')} />
      <Field label="Phone *" type="tel" required style={{ maxWidth: 400 }} {...bind('phone')} />
      <button className="btn btn-outline" onClick={addAddress}>Save Address</button>
    </div>
  );
}

export default function Profile() {
  useDocumentTitle('My Profile — LAXSHOBHA');
  const { user, signOut, updateUser } = useAuth();
  const addresses = useAsync(() => getAddresses(), [user.id]);
  const [params] = useSearchParams();
  // After placing an order, checkout sends people here with ?order=<id> — open the Orders tab.
  const requestedTab = params.get('order') ? 'orders' : params.get('tab');
  const [tab, setTab] = useState(['info', 'orders', 'wishlist', 'addresses'].includes(requestedTab) ? requestedTab : 'info');
  const profileComplete = Boolean(user.name?.trim() && user.phone?.trim() && addresses.data?.length);

  // RequireAuth sends people to the home page as soon as they're signed out.
  const handleSignOut = () => signOut();

  return (
    <section className="section profile-page">
      <div className="container profile-container">
        <div className="profile-page-header">
          <div className="profile-heading">
            <img className="profile-heading-avatar" src={user.photoURL || PLACEHOLDER.avatar} alt="" />
            <div>
              <h1>My Account</h1>
            </div>
          </div>
          <button className="btn btn-outline btn-small" onClick={handleSignOut}>Sign Out</button>
        </div>

        <div className="profile-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {!addresses.loading && !profileComplete && (
          <div className="profile-completion" role="status">
            <div><strong>Finish setting up your account</strong><p>Add your phone and delivery address before checkout.</p></div>
            <button className="btn btn-outline btn-small" onClick={() => setTab(user.phone ? 'addresses' : 'info')}>Complete details</button>
          </div>
        )}

        {tab === 'info' && <PersonalInfoTab user={user} updateUser={updateUser} />}
        {tab === 'orders' && <OrdersTab user={user} />}
        {tab === 'wishlist' && <WishlistTab user={user} />}
        {tab === 'addresses' && <AddressesTab user={user} />}
      </div>
    </section>
  );
}
