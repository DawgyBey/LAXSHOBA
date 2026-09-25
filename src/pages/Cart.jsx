import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import QtyControl from '../components/QtyControl';
import { PLACEHOLDER } from '../lib/constants';
import { formatPrice } from '../lib/format';

export default function Cart() {
  useDocumentTitle('Your Cart — LAXSHOBHA');
  const { items, ready, total, setQuantity, removeItem } = useCart();

  // Cart writes are optimistic; if one fails the cart rolls back, so we just tell the person.
  const attempt = (promise) => promise.catch((err) => {
    console.error('Cart update failed:', err);
    alert('Could not update your cart. Please try again.');
  });

  return (
    <section className="section">
      <div className="container">
        <h1 style={{ marginBottom: 32 }}>Your Cart</h1>

        <div className="cart-layout">
          <div>
            {ready && items.length === 0 && (
              <p className="empty-state">Your cart is empty. <Link to="/shop">Continue shopping</Link></p>
            )}

            {items.map((item, index) => (
              <div className="cart-row" key={`${item.productId}-${item.size}-${item.color}`}>
                <img src={item.image || PLACEHOLDER.product} alt={item.name} />
                <div className="cart-row-info">
                  <p className="product-name">{item.name}</p>
                  <p className="eyebrow-plain">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
                  <p className="product-price">{formatPrice(item.price)}</p>
                  <QtyControl value={item.quantity} onChange={(q) => attempt(setQuantity(index, q))} />
                </div>
                <button className="cart-remove" type="button" aria-label="Remove" onClick={() => attempt(removeItem(index))}>&times;</button>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="summary-box">
              <h3 style={{ marginBottom: 20 }}>Order Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
              <Link to="/checkout" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', marginTop: 12 }}>Checkout</Link>
              <Link to="/shop" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', marginTop: 10 }}>Continue Shopping</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
