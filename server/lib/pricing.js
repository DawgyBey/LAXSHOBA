// Server-side order pricing. Never trusts client prices, totals, names or stock.
import { isObjectId } from './validate.js';

export class OrderError extends Error {
  constructor(message, status = 400, code = 'ORDER_INVALID') { super(message); this.status = status; this.code = code; }
}
const money = (n) => Math.round(n * 100) / 100;
export const effectivePrice = (p) => (p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price);
export const MAX_LINES = 50;
export const MAX_QTY = 20;

// lines: untrusted [{productId, quantity, size?, color?}]. productsById: Map<string, product> already loaded from the DB.
export function priceOrder(lines, productsById) {
  if (!Array.isArray(lines) || lines.length === 0) throw new OrderError('Your cart is empty');
  if (lines.length > MAX_LINES) throw new OrderError('Too many items in one order');
  const wanted = new Map(); // productId -> total quantity (for stock checks across size/colour lines)
  const items = lines.map((line) => {
    const productId = String(line?.productId ?? '');
    const quantity = Number(line?.quantity);
    if (!isObjectId(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) throw new OrderError('Invalid cart item');
    const product = productsById.get(productId);
    if (!product || product.published !== true) throw new OrderError('An item in your cart is no longer available', 409, 'ITEM_UNAVAILABLE');
    const size = typeof line.size === 'string' ? line.size : '';
    const color = typeof line.color === 'string' ? line.color : '';
    if (size && product.sizes?.length && !product.sizes.includes(size)) throw new OrderError('Selected size is not available', 409, 'ITEM_UNAVAILABLE');
    if (color && product.colors?.length && !product.colors.includes(color)) throw new OrderError('Selected colour is not available', 409, 'ITEM_UNAVAILABLE');
    wanted.set(productId, (wanted.get(productId) || 0) + quantity);
    return { productId, name: product.name, image: product.images?.[0] || '', price: effectivePrice(product), size, color, quantity };
  });
  for (const [productId, qty] of wanted) {
    if (!(productsById.get(productId).stock >= qty)) throw new OrderError('Not enough stock for an item in your cart', 409, 'OUT_OF_STOCK');
  }
  const subtotal = money(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  return { items, subtotal, total: subtotal, wanted };
}
