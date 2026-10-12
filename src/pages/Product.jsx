// Product detail page. Reads the product by its Mongo document id (from the URL),
// and performs real add-to-cart / wishlist writes.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Loading from '../components/Loading';
import Price from '../components/Price';
import QtyControl from '../components/QtyControl';
import ZoomImage from '../components/ZoomImage';
import { DEMO_PRODUCTS, PLACEHOLDER } from '../lib/constants';
import { getProduct } from '../lib/data';
import { discountPercent, effectivePrice, formatPrice } from '../lib/format';
import { toast } from '../lib/toast';

function OptionGroup({ title, values, selected, onSelect }) {
  if (values.length === 0) return null;
  return (
    <div className="option-group">
      <h4>{title}</h4>
      <div className="option-pills">
        {values.map((v) => (
          <span
            key={v}
            role="button"
            tabIndex={0}
            className={`option-pill${v === selected ? ' selected' : ''}`}
            onClick={() => onSelect(v)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(v))}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProductDetail({ product }) {
  const { user } = useAuth();
  const { addItem, ready } = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();

  const images = product.images?.length ? product.images : [PLACEHOLDER.product];
  const sizes = product.sizes || [];
  const colors = product.colors || [];

  const [activeIndex, setActiveIndex] = useState(0);
  // Default to the first option so add-to-cart always has a value.
  const [size, setSize] = useState(sizes[0] ?? null);
  const [color, setColor] = useState(colors[0] ?? null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  const inStock = product.stock > 0;

  const wished = wishlist.has(product.id);
  const percentOff = discountPercent(product);
  const youSave = percentOff > 0 ? product.price - product.salePrice : 0;
  const lowStock = inStock && product.stock <= 5;

  async function addToCart(goToCheckout) {
    setBusy(true);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        image: product.images?.[0] || '',
        price: effectivePrice(product),
        size,
        color,
        quantity: qty,
      });
      navigate(goToCheckout ? '/checkout' : '/cart');
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert('Could not add this to your cart. Please try again.');
      setBusy(false);
    }
  }

  async function toggleWishlist() {
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
    <section className="section">
      <div className="container product-detail">
        <div className="product-gallery">
          <div className="product-gallery-main">
            <span className="gallery-index">{String(activeIndex + 1).padStart(2, '0')} <i /> {String(images.length).padStart(2, '0')}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div className="gallery-image-frame" key={images[activeIndex]} initial={{ opacity: 0, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} transition={{ duration: 0.35 }}>
                <ZoomImage src={images[activeIndex]} alt={`${product.name}, view ${activeIndex + 1}`} zoom={2} />
              </motion.div>
            </AnimatePresence>
            {images.length > 1 && <div className="gallery-controls">
              <button type="button" aria-label="Previous image" onClick={() => setActiveIndex((index) => (index - 1 + images.length) % images.length)}>←</button>
              <button type="button" aria-label="Next image" onClick={() => setActiveIndex((index) => (index + 1) % images.length)}>→</button>
            </div>}
          </div>
          <div className="product-gallery-thumbs">
            {images.map((img, i) => (
              <button key={`${img}-${i}`} type="button" className={i === activeIndex ? 'active' : ''} aria-label={`Show image ${i + 1} of ${images.length}`} aria-pressed={i === activeIndex} onClick={() => setActiveIndex(i)}>
                <img src={img} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="product-price">
            <Price product={product} />
            {percentOff > 0 && <span className="badge">Sale</span>}
          </p>
          {youSave > 0 && <p className="you-save">You save {formatPrice(youSave)}</p>}
          <p className={`availability ${inStock ? 'in-stock' : 'out-stock'}`}>
            {!inStock ? 'Out of stock' : lowStock ? `Only ${product.stock} left` : 'In stock'}
          </p>
          <p>{product.description}</p>

          <OptionGroup title="Size" values={sizes} selected={size} onSelect={setSize} />
          <OptionGroup title="Color" values={colors} selected={color} onSelect={setColor} />

          <div className="qty-row">
            <QtyControl value={qty} onChange={setQty} max={product.stock || 99} />
          </div>

          <div className="product-actions">
            <button className="btn btn-primary" disabled={!inStock || busy || !ready} onClick={() => addToCart(false)}>Add to bag</button>
            <button className="btn btn-gold" disabled={!inStock || busy || !ready} onClick={() => addToCart(true)}>Buy now</button>
            <button className={`btn btn-outline btn-wish${wished ? ' is-on' : ''}`} aria-pressed={wished} onClick={toggleWishlist}>{wished ? 'Saved to wishlist' : 'Add to wishlist'}</button>
          </div>

          <ul className="product-assurance">
            <li>Cash on delivery available at checkout</li>
            <li>Track your order from your account</li>
            <li>Chosen and checked by hand before it ships</li>
          </ul>

          <div className="product-meta">
            <dl>
              <dt>Fabric</dt><dd>{product.fabric || '—'}</dd>
              <dt>Color</dt><dd>{colors.join(', ') || '—'}</dd>
              <dt>Occasion</dt><dd>{(product.occasion || []).join(', ') || '—'}</dd>
              <dt>Care</dt><dd>{product.care || '—'}</dd>
            </dl>
          </div>
          {product.highlights?.length > 0 && (
            <div className="product-highlights">
              <h3>Piece details</h3>
              <ul>{product.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
            </div>
          )}
        </div>
      </div>

      {inStock && (
        <div className="sticky-buy">
          <div className="sticky-buy-price"><Price product={product} /></div>
          <button className="btn btn-primary" disabled={busy || !ready} onClick={() => addToCart(false)}>Add to bag</button>
        </div>
      )}
    </section>
  );
}

export default function Product() {
  const { id } = useParams();
  const { data: product, loading } = useAsync(async () => {
    const demoProduct = DEMO_PRODUCTS.find((demo) => demo.id === id);
    if (demoProduct) return demoProduct;
    try {
      return await getProduct(id);
    } catch (error) {
      console.error('Could not load product:', error);
      return null;
    }
  }, [id]);
  useDocumentTitle(product ? `${product.name} — LAXSHOBHA` : 'Product — LAXSHOBHA');

  if (loading) return <Loading />;
  if (!product) {
    return (
      <section className="section">
        <div className="container"><p className="empty-state">Product not found.</p></div>
      </section>
    );
  }
  // key resets the selected size/colour/quantity if you navigate between products.
  return <ProductDetail key={product.id} product={product} />;
}
