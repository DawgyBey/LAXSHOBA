import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, validatePassword, safeRedirect, canTransition, pick, parsePagination, isObjectId } from '../server/lib/validate.js';

test('normalizeEmail lowercases/trims and rejects junk', () => {
  assert.equal(normalizeEmail('  Admin@LaxShobha.COM '), 'admin@laxshobha.com');
  for (const bad of ['', 'abc', 'a@b', 'a b@c.com', 42, null, undefined, {}, `${'a'.repeat(250)}@x.com`]) assert.equal(normalizeEmail(bad), '');
});
test('admin identity is the full email, never a prefix', () => {
  const allow = new Set(['owner@laxshobha.com']);
  assert.equal(allow.has(normalizeEmail('OWNER@laxshobha.com')), true);
  assert.equal(allow.has(normalizeEmail('owner@evil.com')), false); // same local part, different domain
});
test('validatePassword enforces 8..72 bytes', () => {
  assert.ok(validatePassword('short'));
  assert.ok(validatePassword('x'.repeat(73)));
  assert.ok(validatePassword('é'.repeat(37))); // 74 bytes
  assert.equal(validatePassword('longenough1'), null);
  assert.ok(validatePassword(undefined));
});
test('safeRedirect blocks open redirects', () => {
  for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', 'evil.com', '/ok\nx', 42, undefined]) assert.equal(safeRedirect(bad, '/profile'), '/profile', String(bad));
  assert.equal(safeRedirect('/checkout?x=1', '/'), '/checkout?x=1');
});
test('order status transitions are forward-only', () => {
  assert.ok(canTransition('Pending', 'Confirmed'));
  assert.ok(canTransition('Shipped', 'Delivered'));
  assert.ok(!canTransition('Delivered', 'Pending'));
  assert.ok(!canTransition('Cancelled', 'Confirmed'));
  assert.ok(!canTransition('Pending', 'Delivered'));
  assert.ok(!canTransition('Pending', 'Bogus'));
});
test('pick drops non-allowlisted keys (mass assignment)', () => {
  assert.deepEqual(pick({ name: 'a', role: 'admin', $set: 1 }, ['name']), { name: 'a' });
  assert.deepEqual(pick(null, ['name']), {});
});
test('parsePagination clamps', () => {
  assert.deepEqual(parsePagination({ limit: '9999', page: '3' }, { maxLimit: 100 }), { limit: 100, skip: 200, page: 3 });
  assert.equal(parsePagination({ limit: '-5' }).limit, 1);
  assert.equal(parsePagination({}).skip, 0);
});
test('isObjectId', () => { assert.ok(isObjectId('507f1f77bcf86cd799439011')); assert.ok(!isObjectId({ $ne: 1 })); assert.ok(!isObjectId('abc')); });
