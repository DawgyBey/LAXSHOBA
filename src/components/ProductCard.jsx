import { Link } from 'react-router-dom';
import Price from './Price';
import { PLACEHOLDER } from '../lib/constants';
import { firstImage } from '../lib/format';

export default function ProductCard({ product, showBadge = false }) {
  return (
    <Link className="product-card" to={`/product/${product.id}`}>
      <div className="product-photo">
        <img src={firstImage(product, PLACEHOLDER.product)} alt={product.name} loading="lazy" decoding="async" />
      </div>
      {showBadge && (
        <span className={`tag-badge${product.isHotPick ? '' : ' tag-badge-spacer'}`}>
          {product.isHotPick ? 'Hot Pick' : '\u00a0'}
        </span>
      )}
      <p className="product-name">{product.name}</p>
      <p className="product-price"><Price product={product} /></p>
    </Link>
  );
}
