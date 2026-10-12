import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, productSpec, categorySpec, pageSpec, homepageSpec, sanitizeCartLines, imageRef } from '../server/lib/schemas.js';

test('product: unknown/privileged keys are dropped, bad types rejected', () => {
  const r = sanitize({ name: 'Kurta', price: 900, stock: 3, _id: 'x', $where: '1', createdAt: 1, role: 'admin' }, productSpec);
  assert.deepEqual(r.value, { name: 'Kurta', price: 900, stock: 3 });
  for (const bad of [{ name: 'a', price: -1 }, { name: 'a', price: '10' }, { name: '', price: 1 }, { name: 'a', price: 1, stock: 1.5 }, { name: 'a', price: 1, images: ['javascript:alert(1)'] }, { name: { $gt: '' }, price: 1 }, { name: 'a', price: 1, sizes: 'S' }])
    assert.ok(sanitize(bad, productSpec).error, JSON.stringify(bad));
});
test('product PATCH (partial) does not require fields and cannot republish silently', () => {
  assert.deepEqual(sanitize({ stock: 4 }, productSpec, { partial: true }).value, { stock: 4 });
  assert.ok(!('published' in sanitize({ stock: 4 }, productSpec, { partial: true }).value));
});
test('imageRef allows safe refs only', () => {
  for (const ok of ['', '/photos/a.jpg', 'https://cdn.example.com/a.jpg', 'data:image/png;base64,AAAA']) assert.notEqual(imageRef()(ok).toString(), 'Symbol(invalid)', ok);
  for (const bad of ['//evil.com/x.png', 'http://x/a.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,AAAA', 'data:text/html;base64,AAAA']) assert.equal(typeof imageRef()(bad), 'symbol', bad);
});
test('category/page/homepage allowlists', () => {
  assert.deepEqual(sanitize({ name: 'Sarees', slug: 'Sarees', __proto__: { x: 1 }, isAdmin: true }, categorySpec).value, { name: 'Sarees', slug: 'sarees' });
  assert.ok(sanitize({ name: 'x', slug: 'Bad Slug!' }, categorySpec).error);
  assert.ok(sanitize({ slug: '../etc', name: 'x' }, pageSpec).error);
  assert.deepEqual(sanitize({ heroTitle: 'Hi', key: 'other', $set: {} }, homepageSpec).value, { heroTitle: 'Hi' });
});
test('cart lines keep only display fields and valid quantities', () => {
  const ok = sanitizeCartLines([{ productId: 'a'.repeat(24), quantity: 2, price: 5, evil: 1, name: 'n' }]);
  assert.deepEqual(Object.keys(ok[0]).sort(), ['color', 'image', 'name', 'price', 'productId', 'quantity', 'size']);
  assert.equal(sanitizeCartLines([{ productId: 'a', quantity: 0 }]), null);
  assert.equal(sanitizeCartLines('x'), null);
  assert.equal(sanitizeCartLines(Array.from({ length: 51 }, () => ({ productId: 'a', quantity: 1 }))), null);
});
