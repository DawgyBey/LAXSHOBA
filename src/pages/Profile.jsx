// Profile page: personal info, order history, wishlist, saved addresses.
// All four tabs read/write real data tied to the signed-in user through the API.
// (Route is wrapped in <RequireAuth>, so `user` is always set here.)
import { toast } from '../lib/toast';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Avatar from '../components/Avatar';
import Field from '../components/Field';
import ProductGrid from '../components/ProductGrid';
import { getAddresses, getOrders, getWishlist, removeAddress as removeAddressRequest, saveAddress, updateProfile } from '../lib/data';
import { formatDate, formatPrice, shortOrderId } from '../lib/format';
import { resizeImageFile } from '../lib/image';
import { AVATAR_TYPES, MAX_AVATAR_DATA_CHARS, MAX_AVATAR_FILE_BYTES, validateName, validatePhone, validateRequired } from '../lib/validation';

const TABS = [
  { id: 'info', label: 'Personal Information' },
  { id: 'orders', label: 'Orders' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'addresses', label: 'Addresses' },
];
const PAYMENT_LABELS = { cod: 'Cash on Delivery', bank: 'Bank Transfer' };

function Notice({ notice }) {
  if (!notice) return null;
  return <p className={`profile-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>;
}

function LoadError({ message, onRetry }) {
  return (
    <div className="profile-notice error" role="alert">
      <p>{message || 'We could not load this right now.'}</p>
      <button type="button" className="btn btn-outline btn-small" onClick={onRetry}>Try again</button>
    </div>
  );
}

// Re-encodes the cropped square until it fits the size the server accepts.
function cropToDataUrl(image, zoom, xPercent, yPercent) {
  for (const [size, quality] of [[640, 0.84], [512, 0.78], [400, 0.7], [320, 0.6]]) {
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * zoom;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    canvas.getContext('2d').drawImage(image, ((size - width) * xPercent) / 100, ((size - height) * yPercent) / 100, width, height);
    const url = canvas.toDataURL('image/jpeg', quality);
    if (url.length <= MAX_AVATAR_DATA_CHARS) return url;
  }
  return null;
}

function PersonalInfoTab({ user, updateUser }) {
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [cropSource, setCropSource] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(50);
  const cropImage = useRef(null);

  useEffect(() => () => { if (cropSource) URL.revokeObjectURL(cropSource); }, [cropSource]);

  const validate = (values) => ({ name: validateName(values.name), phone: validatePhone(values.phone) });
  const hasErrors = (e) => Object.values(e).some(Boolean);
  const changed = form.name.trim() !== (user.name || '') || form.phone.trim() !== (user.phone || '');

  function change(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
    setNotice(null);
  }

  async function save(event) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (hasErrors(found)) { setNotice({ type: 'error', text: 'Please fix the highlighted fields.' }); return; }
    setSaving(true);
    setNotice(null);
    try {
      // Only name and phone are sent; the picture is saved separately and the server ignores anything else.
      const result = await updateProfile({ name: form.name.trim(), phone: form.phone.trim() });
      updateUser(result.user);
      setForm({ name: result.user.name || '', phone: result.user.phone || '' });
      setNotice({ type: 'success', text: 'Your details were saved.' });
    } catch (err) {
      console.error('Saving profile failed:', err);
      setNotice({ type: 'error', text: err.message || 'Could not save your changes. Please try again.' });
    }
    setSaving(false);
  }

  async function choosePhoto(event) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) { setNotice({ type: 'error', text: 'Please choose a JPG, PNG or WebP image.' }); return; }
    if (file.size > MAX_AVATAR_FILE_BYTES) { setNotice({ type: 'error', text: 'That image is larger than 8 MB. Please choose a smaller one.' }); return; }
    try {
      const resized = await resizeImageFile(file, { maxDimension: 1200, quality: 0.86 });
      if (cropSource) URL.revokeObjectURL(cropSource);
      setCropSource(URL.createObjectURL(resized));
      setCropZoom(1);
      setCropX(50);
      setCropY(50);
      setNotice(null);
    } catch (err) {
      console.error('Reading picture failed:', err);
      setNotice({ type: 'error', text: 'We could not read that image. Try a different file.' });
    }
  }

  function cancelCrop() {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
  }

  async function savePhoto(photoURL, successText) {
    setSaving(true);
    setNotice(null);
    try {
      const result = await updateProfile({ photoURL });
      updateUser(result.user);
      setNotice({ type: 'success', text: successText });
      return true;
    } catch (err) {
      console.error('Updating profile picture failed:', err);
      setNotice({ type: 'error', text: err.message || 'Could not update your profile picture. Please try again.' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveCroppedPhoto() {
    if (!cropImage.current || !cropSource) return;
    const photoURL = cropToDataUrl(cropImage.current, cropZoom, cropX, cropY);
    if (!photoURL) { setNotice({ type: 'error', text: 'That picture is too detailed to save. Try a simpler or smaller image.' }); cancelCrop(); return; }
    if (await savePhoto(photoURL, 'Profile picture updated.')) cancelCrop();
  }

  return (
    <form className="profile-panel profile-info" onSubmit={save} noValidate>
      <div className="profile-avatar-editor">
        <Avatar src={user.photoURL} name={user.name} className="profile-avatar" alt="Your profile picture" />
        <div className="profile-avatar-actions">
          <label className="btn btn-outline btn-small">
            Change picture
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={saving} />
          </label>
          {user.photoURL && <button type="button" className="btn btn-outline btn-small" disabled={saving} onClick={() => savePhoto('', 'Profile picture removed.')}>Remove</button>}
        </div>
      </div>

      <div className="profile-fields">
        <p className="profile-required-note">Keep your contact details up to date so we can reach you about delivery.</p>
        <Notice notice={notice} />
        <div className="field-row">
          <Field label="Full name *" type="text" name="name" autoComplete="name" required value={form.name} error={errors.name} onChange={(e) => change('name', e.target.value)} />
          <Field label="Phone *" type="tel" name="phone" autoComplete="tel" inputMode="tel" required value={form.phone} error={errors.phone} onChange={(e) => change('phone', e.target.value)} />
        </div>
        <Field label="Email" type="email" value={user.email || ''} disabled readOnly hint="Your email is used to sign in and can’t be changed here." />
        <button className="btn btn-primary" type="submit" disabled={saving || !changed}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div>

      {cropSource && <div className="crop-editor" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <div className="crop-editor-head">
          <div><span className="eyebrow">Profile picture</span><h2 id="crop-title">Crop your picture</h2></div>
          <button className="crop-close" type="button" onClick={cancelCrop} aria-label="Cancel crop">×</button>
        </div>
        <div className="crop-preview"><img ref={cropImage} src={cropSource} alt="Crop preview" style={{ objectPosition: `${cropX}% ${cropY}%`, transform: `scale(${cropZoom})` }} /></div>
        <label className="crop-control">Zoom <input type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} /></label>
        <label className="crop-control">Horizontal position <input type="range" min="0" max="100" value={cropX} onChange={(e) => setCropX(Number(e.target.value))} /></label>
        <label className="crop-control">Vertical position <input type="range" min="0" max="100" value={cropY} onChange={(e) => setCropY(Number(e.target.value))} /></label>
        <div className="crop-actions"><button className="btn btn-outline" type="button" onClick={cancelCrop}>Cancel</button><button className="btn btn-primary" type="button" onClick={saveCroppedPhoto} disabled={saving}>{saving ? 'Saving…' : 'Use this picture'}</button></div>
      </div>}
    </form>
  );
}

function OrdersTab({ user, highlightId }) {
  const orders = useAsync(() => getOrders(), [user.id]);
  const list = orders.data ?? [];
  return (
    <div className="profile-panel">
      {orders.loading && !orders.data && <p className="empty-state" role="status">Loading your orders…</p>}
      {orders.error && !orders.loading && <LoadError message="We could not load your orders." onRetry={orders.reload} />}
      {!orders.loading && !orders.error && list.length === 0 && <p className="empty-state">You have not placed any orders yet.</p>}
      {list.map((o) => (
        <div className={`order-row${o.id === highlightId ? ' order-row-new' : ''}`} key={o.id}>
          <div className="order-row-head">
            <span>Order {shortOrderId(o.id)} · {formatDate(o.createdAt)}</span>
            <span className="status-pill">{o.status}</span>
          </div>
          <ul className="order-items">
            {(o.items || []).map((i, n) => <li key={n}>{i.name} × {i.quantity}{i.size ? ` · ${i.size}` : ''}{i.color ? ` · ${i.color}` : ''}</li>)}
          </ul>
          <p className="eyebrow-plain">Total {formatPrice(o.total)} · {PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod}{o.paymentStatus === 'unpaid' ? ' · payment due' : ''}</p>
        </div>
      ))}
    </div>
  );
}

function WishlistTab({ user }) {
  const wishlist = useAsync(() => getWishlist(), [user.id]);
  return (
    <div className="profile-panel profile-panel-wide">
      {wishlist.loading && !wishlist.data && <p className="empty-state" role="status">Loading your wishlist…</p>}
      {wishlist.error && !wishlist.loading && <LoadError message="We could not load your wishlist." onRetry={wishlist.reload} />}
      {!wishlist.loading && !wishlist.error && <ProductGrid products={wishlist.data ?? []} emptyMessage="Nothing saved yet." />}
    </div>
  );
}

const EMPTY_ADDRESS = { label: '', street: '', city: '', phone: '' };

function AddressesTab({ addresses }) {
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const bind = (key) => ({
    value: form[key],
    error: errors[key],
    onChange: (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); if (errors[key]) setErrors((x) => ({ ...x, [key]: '' })); },
  });

  async function addAddress(event) {
    event.preventDefault();
    const found = { street: validateRequired(form.street, 'Street address'), city: validateRequired(form.city, 'City', 100), phone: validatePhone(form.phone) };
    setErrors(found);
    if (Object.values(found).some(Boolean)) { setNotice({ type: 'error', text: 'Please fix the highlighted fields.' }); return; }
    setBusy(true);
    setNotice(null);
    try {
      await saveAddress({ label: form.label.trim() || 'Home', street: form.street.trim(), city: form.city.trim(), phone: form.phone.trim() });
      setForm(EMPTY_ADDRESS);
      addresses.reload();
      setNotice({ type: 'success', text: 'Address saved.' });
    } catch (err) {
      console.error('Saving address failed:', err);
      setNotice({ type: 'error', text: err.message || 'Could not save that address. Please try again.' });
    }
    setBusy(false);
  }

  async function removeAddress(id) {
    if (!window.confirm('Remove this address?')) return;
    try {
      await removeAddressRequest(id);
      addresses.reload();
    } catch (err) {
      console.error('Removing address failed:', err);
      toast('Could not remove that address. Please try again.', { tone: 'error' });
    }
  }

  const list = addresses.data ?? [];
  return (
    <div className="profile-panel">
      <div className="address-list">
        {addresses.loading && !addresses.data && <p className="empty-state" role="status">Loading your addresses…</p>}
        {addresses.error && !addresses.loading && <LoadError message="We could not load your addresses." onRetry={addresses.reload} />}
        {!addresses.loading && !addresses.error && list.length === 0 && <p className="empty-state">No saved addresses yet.</p>}
        {list.map((a) => (
          <div className="address-row" key={a.id}>
            <div>
              <strong>{a.label}</strong>
              <p className="eyebrow-plain">{a.street}, {a.city} · {a.phone}</p>
            </div>
            <button type="button" className="btn btn-outline btn-small" onClick={() => removeAddress(a.id)}>Remove</button>
          </div>
        ))}
      </div>

      <form onSubmit={addAddress} noValidate>
        <h2 className="profile-subhead">Add a new address</h2>
        <Notice notice={notice} />
        <div className="field-row">
          <Field label="Label (optional)" type="text" placeholder="Home, Office…" autoComplete="off" {...bind('label')} />
          <Field label="Phone *" type="tel" inputMode="tel" autoComplete="tel" required {...bind('phone')} />
        </div>
        <Field label="Street address *" type="text" autoComplete="street-address" required {...bind('street')} />
        <Field label="City *" type="text" autoComplete="address-level2" required {...bind('city')} />
        <button className="btn btn-outline" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
      </form>
    </div>
  );
}

export default function Profile() {
  useDocumentTitle('My Account — LAXSHOBHA');
  const { user, signOut, updateUser } = useAuth();
  // Loaded once here and shared with the Addresses tab (previously fetched twice).
  const addresses = useAsync(() => getAddresses(), [user.id]);
  const [params] = useSearchParams();
  const orderId = params.get('order') || '';
  // After placing an order, checkout sends people here with ?order=<id> — open the Orders tab.
  const requestedTab = orderId ? 'orders' : params.get('tab');
  const [tab, setTab] = useState(TABS.some((t) => t.id === requestedTab) ? requestedTab : 'info');
  const profileComplete = Boolean(user.name?.trim() && user.phone?.trim() && addresses.data?.length);

  // RequireAuth sends people to the home page as soon as they're signed out.
  const handleSignOut = () => signOut().catch((err) => toast(err.message, { tone: 'error' }));

  return (
    <section className="section profile-page">
      <div className="container profile-container">
        <div className="profile-page-header">
          <div className="profile-heading">
            <Avatar src={user.photoURL} name={user.name} className="profile-heading-avatar" />
            <div>
              <h1>My Account</h1>
              {user.email && <p className="profile-heading-email">{user.email}</p>}
            </div>
          </div>
          <button className="btn btn-outline btn-small" onClick={handleSignOut}>Sign out</button>
        </div>

        <div className="profile-tabs" role="tablist" aria-label="Account sections">
          {TABS.map((t) => (
            <button key={t.id} id={`tab-${t.id}`} role="tab" aria-selected={tab === t.id} aria-controls="profile-tabpanel" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {!addresses.loading && !addresses.error && !profileComplete && (
          <div className="profile-completion" role="status">
            <div><strong>Finish setting up your account</strong><p>Add your phone and a delivery address before checkout.</p></div>
            <button className="btn btn-outline btn-small" onClick={() => setTab(user.phone ? 'addresses' : 'info')}>Complete details</button>
          </div>
        )}

        <div id="profile-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'info' && <PersonalInfoTab user={user} updateUser={updateUser} />}
          {tab === 'orders' && <OrdersTab user={user} highlightId={orderId} />}
          {tab === 'wishlist' && <WishlistTab user={user} />}
          {tab === 'addresses' && <AddressesTab addresses={addresses} />}
        </div>
      </div>
    </section>
  );
}
