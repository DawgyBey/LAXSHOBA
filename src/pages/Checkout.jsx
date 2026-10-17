// Checkout page (route is wrapped in <RequireAuth>, so `user` is always set here).
// Writes a real order document to the API and clears the cart on confirm.
// Payment is "Cash on Delivery" / "Bank Transfer" for now — structured so a gateway
// can slot into placeOrder() later without changing the rest of the flow.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Field from '../components/Field';
import { getAddresses, saveOrder } from '../lib/data';
import { formatPrice } from '../lib/format';
import { toast } from '../lib/toast';

const PAYMENT_OPTIONS = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'bank', label: 'Bank Transfer' },
];

export default function Checkout() {
  useDocumentTitle('Checkout — LAXSHOBHA');
  const { user } = useAuth();
  const { items, ready, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: '',
    street: '',
    city: '',
  });
  const [payment, setPayment] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [savedAddressId, setSavedAddressId] = useState('');

  const addresses = useAsync(async () =>
    getAddresses(), []);
  const savedAddresses = addresses.data ?? [];

  const bind = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });

  function chooseSavedAddress(id) {
    setSavedAddressId(id);
    const a = savedAddresses.find((x) => x.id === id);
    if (a) setForm((f) => ({ ...f, street: a.street, city: a.city, phone: a.phone }));
  }

  async function placeOrder() {
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const street = form.street.trim();
    const city = form.city.trim();

    if (!name || !phone || !street || !city) {
      toast('Please fill in your contact info and delivery address.', { tone: 'error' });
      return;
    }

    setPlacing(true);
    try {
      const order = await saveOrder({
        customerName: name,
        customerEmail: email,
        items,
        subtotal: total,
        total,
        address: { street, city, phone },
        paymentMethod: payment,
        status: 'Pending',
      });

      // The order exists now — a failure to empty the cart shouldn't look like a failed order.
      try { await clearCart(); } catch (err) { console.error('Could not clear cart:', err); }
      navigate(`/profile?order=${order.id}`);
    } catch (err) {
      console.error('Order failed:', err);
      toast(err.status === 409 || err.status === 400 ? err.message : 'Something went wrong placing your order. Please try again.', { tone: 'error' });
      setPlacing(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Checkout</h1>

        <div className="cart-layout">
          <div className="checkout-form">
            <h3>1. Contact Information</h3>
            <Field label="Full Name" type="text" {...bind('name')} />
            <Field label="Email" type="email" {...bind('email')} />
            <Field label="Phone" type="tel" {...bind('phone')} />

            <h3>2. Delivery Address</h3>
            {savedAddresses.length > 0 && (
              <select
                className="checkout-select"
                aria-label="Use a saved address"
                value={savedAddressId}
                onChange={(e) => chooseSavedAddress(e.target.value)}
              >
                <option value="">Enter a new address below</option>
                {savedAddresses.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}: {a.street}, {a.city}</option>
                ))}
              </select>
            )}
            <Field label="Street Address" type="text" {...bind('street')} />
            <Field label="City" type="text" {...bind('city')} />

            <h3>3. Payment Method</h3>
            {PAYMENT_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`payment-option${payment === o.value ? ' selected' : ''}`}
              >
                <input type="radio" name="payment" value={o.value} checked={payment === o.value} onChange={() => setPayment(o.value)} />
                <span>{o.label}</span>
              </label>
            ))}
            <p className="field-note">Online payment can be added here once a payment gateway is connected.</p>
          </div>

          <div className="summary-box">
            <h3>Order Summary</h3>
            <div>
              {ready && items.length === 0 && <p className="empty-state">Your cart is empty.</p>}
              {items.map((item, i) => (
                <div className="order-summary-item" key={i}>
                  <span>{item.name} ({item.quantity}{item.size ? `, ${item.size}` : ''})</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
            <button
              className="btn btn-primary btn-block"
              disabled={!ready || items.length === 0 || placing}
              onClick={placeOrder}
            >
              {placing ? 'Placing order…' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
