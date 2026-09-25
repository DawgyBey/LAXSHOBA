// Product detail page. Reads the product by its Mongo document id (from the URL),
// and performs real add-to-cart / wishlist writes.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Loading from '../components/Loading';
import Price from '../components/Price';
import QtyControl from '../components/QtyControl';
import ZoomImage from '../components/ZoomImage';
import { DEMO_PRODUCTS, PLACEHOLDER } from '../lib/constants';
import { getProduct, getWishlist, saveWishlist } from '../lib/data';
import { effectivePrice } from '../lib/format';

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
  const [wished, setWished] = useState(false);

  const inStock = product.stock > 0;

  // Is this product already on the signed-in user's wishlist?
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) { setWished(false); return; }
    let cancelled = false;
    getWishlist()
      .then((products) => { if (!cancelled) setWished(products.some((item) => item.id === product.id)); })
      .catch((err) => console.error('Could not load wishlist:', err));
    return () => { cancelled = true; };
  }, [uid, product.id]);

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
    const next = !wished;
    setWished(next);
    try {
      await saveWishlist(product.id, next);
    } catch (err) {
      console.error('Wishlist update failed:', err);
      setWished(!next);
      alert('Could not update your wishlist. Please try again.');
    }
  }

  return (
    <section className="section">
      <div className="container product-detail">
        <div className="product-gallery">
          <div className="product-gallery-main"><ZoomImage src={images[activeIndex]} alt={product.name} zoom={2} /></div>
          <div className="product-gallery-thumbs">
            {images.map((img, i) => (
              <img key={`${img}-${i}`} src={img} alt="" className={i === activeIndex ? 'active' : ''} onClick={() => setActiveIndex(i)} loading="lazy" decoding="async" />
            ))}
          </div>
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="product-price"><Price product={product} /></p>
          <p className={`availability ${inStock ? 'in-stock' : 'out-stock'}`}>{inStock ? 'In stock' : 'Out of stock'}</p>
          <p>{product.description}</p>

          <OptionGroup title="Size" values={sizes} selected={size} onSelect={setSize} />
          <OptionGroup title="Color" values={colors} selected={color} onSelect={setColor} />

          <div className="qty-row">
            <QtyControl value={qty} onChange={setQty} max={product.stock || 99} />
          </div>

          <div className="product-actions">
            <button className="btn btn-primary" disabled={!inStock || busy || !ready} onClick={() => addToCart(false)}>Add to Cart</button>
            <button className="btn btn-outline" disabled={!inStock || busy || !ready} onClick={() => addToCart(true)}>Buy Now</button>
            <button className="btn btn-outline" onClick={toggleWishlist}>{wished ? 'Remove from Wishlist' : 'Wishlist'}</button>
          </div>

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
