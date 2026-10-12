import test from 'node:test';
import assert from 'node:assert/strict';
import { priceOrder, OrderError } from '../server/lib/pricing.js';

const A = '507f1f77bcf86cd799439011', B = '507f1f77bcf86cd799439012', C = '507f1f77bcf86cd799439013';
const catalog = () => new Map([
  [A, { name: 'Kurta', price: 1000, salePrice: 800, stock: 5, published: true, sizes: ['S', 'M'], colors: ['Red'], images: ['/a.jpg'] }],
  [B, { name: 'Dupatta', price: 500, salePrice: null, stock: 1, published: true, sizes: [], colors: [], images: [] }],
  [C, { name: 'Draft', price: 10, stock: 9, published: false }],
]);
const rejects = (lines, code) => assert.throws(() => priceOrder(lines, catalog()), (e) => e instanceof OrderError && (!code || e.code === code));

test('uses DB prices; ignores client price/total/name', () => {
  const r = priceOrder([{ productId: A, quantity: 2, price: 1, name: 'HACK', total: 0, size: 'M' }], catalog());
  assert.equal(r.items[0].price, 800); assert.equal(r.items[0].name, 'Kurta'); assert.equal(r.total, 1600);
});
test('sale price above list price is ignored', () => {
  const m = catalog(); m.get(A).salePrice = 5000;
  assert.equal(priceOrder([{ productId: A, quantity: 1 }], m).total, 1000);
});
test('rejects unpublished, unknown, malformed, and non-integer quantities', () => {
  rejects([{ productId: C, quantity: 1 }], 'ITEM_UNAVAILABLE');
  rejects([{ productId: '507f1f77bcf86cd799439099', quantity: 1 }], 'ITEM_UNAVAILABLE');
  rejects([{ productId: { $ne: null }, quantity: 1 }]);
  for (const q of [0, -1, 1.5, 21, '2x', NaN, null]) rejects([{ productId: A, quantity: q }]);
  rejects([]); rejects('nope');
});
test('stock is enforced across split size/colour lines', () => {
  rejects([{ productId: B, quantity: 1 }, { productId: B, quantity: 1, size: '' }], 'OUT_OF_STOCK');
  rejects([{ productId: A, quantity: 3, size: 'S' }, { productId: A, quantity: 3, size: 'M' }], 'OUT_OF_STOCK');
});
test('rejects sizes/colours the product does not offer', () => { rejects([{ productId: A, quantity: 1, size: 'XXL' }]); rejects([{ productId: A, quantity: 1, color: 'Green' }]); });
test('caps line count', () => { rejects(Array.from({ length: 51 }, () => ({ productId: A, quantity: 1 }))); });
