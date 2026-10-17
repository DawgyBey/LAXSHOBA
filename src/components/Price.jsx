import { formatPrice } from '../lib/format';

// Shows "Rs. 900" or, when on sale, the sale price with the original struck through.
export default function Price({ product }) {
  if (!product.salePrice) return <span className="price">{formatPrice(product.price)}</span>;
  return (
    <span className="price">
      <span className="sale">{formatPrice(product.salePrice)}</span>
      <span className="original">{formatPrice(product.price)}</span>
    </span>
  );
}
