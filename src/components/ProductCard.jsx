import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Price from './Price';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { PLACEHOLDER } from '../lib/constants';
import { discountPercent, effectivePrice, firstImage } from '../lib/format';
import { toast } from '../lib/toast';

// One product in a grid: photo, sale/hot badges, wishlist heart, and a quick-add
// bar so people can drop a piece in their bag without opening the product page.
export default function ProductCard({ product, showBadge = false }) {
  const { user } = useAuth();
  const { addItem, ready } = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const [sizesOpen, setSizesOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const sizes = product.sizes || [];
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 5;
  const percentOff = discountPercent(product);
  const wished = wishlist.has(product.id);
  const link = `/product/${product.id}`;

  async function addToBag(size) {
    if (busy || !ready) return;
    setBusy(true);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        image: product.images?.[0] || '',
        price: effectivePrice(product),
        size: size ?? null,
        color: product.colors?.[0] ?? null,
        quantity: 1,
      });
      toast(`${product.name} is in your bag`, { action: { label: 'View bag', to: '/cart' } });
      setSizesOpen(false);
    } catch (err) {
      console.error('Quick add failed:', err);
      toast('Could not add that to your bag. Please try again.', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function onQuickAdd() {
    if (sizes.length === 0) addToBag(null);
    else setSizesOpen((open) => !open);
  }

  async function onWishlist() {
    if (!user) { navigate('/login'); return; }
    try {
      const saved = await wishlist.toggle(product.id);
      toast(saved ? 'Saved to your wishlist' : 'Removed from your wishlist');
    } catch (err) {
      console.error('Wishlist update failed:', err);
      toast('Could not update your wishlist. Please try again.', { tone: 'error' });
    }
  }

  return (
    <article className={`pcard${sizesOpen ? ' is-open' : ''}`}>
      <div className="pcard-media">
        <Link to={link} className="pcard-photo" aria-label={product.name}>
          <img src={firstImage(product, PLACEHOLDER.product)} alt="" loading="lazy" decoding="async" />
        </Link>

        <div className="pcard-badges">
          {!inStock ? <span className="badge">Sold out</span> : percentOff > 0 && <span className="badge">Sale</span>}
        </div>

        <button
          type="button"
          className={`pcard-heart${wished ? ' is-on' : ''}`}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
          onClick={onWishlist}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.5s-7.5-4.6-7.5-10A4.4 4.4 0 0 1 12 7.8a4.4 4.4 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10Z" />
          </svg>
        </button>

        {inStock && (
          <div className="pcard-quick">
            {sizesOpen && (
              <div className="pcard-sizes" role="group" aria-label="Choose a size">
                {sizes.map((size) => (
                  <button key={size} type="button" disabled={busy} onClick={() => addToBag(size)}>{size}</button>
                ))}
              </div>
            )}
            <button type="button" className="pcard-quick-btn" aria-label={sizesOpen ? 'Select a size' : `Add ${product.name} to bag`} disabled={busy || !ready} onClick={onQuickAdd} aria-expanded={sizes.length ? sizesOpen : undefined}>
              {sizesOpen ? 'Select size' : <span aria-hidden="true">+</span>}
            </button>
          </div>
        )}
      </div>

      <Link to={link} className="pcard-body">
        <span className="pcard-name">{product.name}</span>
        <span className="pcard-price"><Price product={product} /></span>
        {lowStock && <span className="pcard-low">Only {product.stock} left</span>}
      </Link>
    </article>
  );
}
