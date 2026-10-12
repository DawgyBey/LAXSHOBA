import { formatPrice } from '../lib/format';

// Shows "Rs. 900" or, when on sale, the sale price with the original struck through.
export default function Price({ product }) {
  if (!product.salePrice) return <>{formatPrice(product.price)}</>;
  return (
    <>
      <span className="sale">{formatPrice(product.salePrice)}</span>
      <span className="original">{formatPrice(product.price)}</span>
    </>
  );
}
