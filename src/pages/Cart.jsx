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
        <h1 style={{ marginBottom: 32 }}>Your bag{ready && items.length > 0 ? <span className="cart-title-count"> ({items.length} {items.length === 1 ? 'item' : 'items'})</span> : null}</h1>

        <div className="cart-layout">
          <div>
            {ready && items.length === 0 && (
              <div className="empty-cart">
                <h2>Your bag is empty</h2>
                <p>Add a piece you love and it will wait for you here.</p>
                <Link to="/shop" className="btn btn-primary">Start shopping</Link>
              </div>
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
              <Link to="/checkout" className="btn btn-gold" style={{ width: '100%', textAlign: 'center', marginTop: 12 }}>Proceed to checkout</Link>
              <Link to="/shop" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', marginTop: 10 }}>Continue shopping</Link>
              <ul className="summary-notes">
                <li>Cash on delivery available</li>
                <li>Order status visible in your account</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
