import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidPhone, validateName, validatePhone } from '../src/lib/validation.js';
import { avatarRef, profileSpec, addressSpec, sanitize } from '../server/lib/schemas.js';

test('isValidPhone accepts real formats and rejects junk', () => {
  for (const ok of ['9812345678', '+977 981-234-5678', '(01) 4412345', ' 98 12 34 56 78 ']) assert.equal(isValidPhone(ok), true, ok);
  for (const bad of ['', '12345', 'abcdefghij', '98123<script>', '+', '1234567890123456', null, 9812345678]) assert.equal(isValidPhone(bad), false, String(bad));
});

test('client validators return messages only for bad input', () => {
  assert.equal(validateName('Sita Devi'), '');
  assert.notEqual(validateName(' a '), '');
  assert.equal(validatePhone('9812345678'), '');
  assert.notEqual(validatePhone('abc'), '');
});

test('profile update only ever yields name, phone and photoURL (no role/email/id/wishlist/tokenVersion)', () => {
  const { value, error } = sanitize({ name: 'Sita Devi', phone: '9812345678', role: 'admin', email: 'x@y.com', _id: '1', id: '1', wishlist: ['a'], tokenVersion: 99, passwordHash: 'x', googleSub: 'x' }, profileSpec, { partial: true });
  assert.equal(error, undefined);
  assert.deepEqual(Object.keys(value).sort(), ['name', 'phone']);
  assert.equal(value.role, undefined);
});

test('profile update validates each supplied field and allows a picture-only update', () => {
  assert.ok(sanitize({ phone: 'nope' }, profileSpec, { partial: true }).error);
  assert.ok(sanitize({ name: 'A' }, profileSpec, { partial: true }).error);
  assert.deepEqual(sanitize({ photoURL: '' }, profileSpec, { partial: true }).value, { photoURL: '' });
});

test('avatarRef allows https and small raster data URIs only', () => {
  const ok = avatarRef();
  assert.equal(ok('https://lh3.googleusercontent.com/a/abc=s96-c'), 'https://lh3.googleusercontent.com/a/abc=s96-c');
  assert.match(ok('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), /^data:image\/jpeg/);
  assert.equal(ok(''), '');
  for (const bad of ['javascript:alert(1)', 'http://insecure.example/x.jpg', '//evil.example/x.jpg', '/uploads/x.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:text/html;base64,PGgxPg==', `data:image/jpeg;base64,${'A'.repeat(400_100)}`, 42, null]) {
    assert.equal(typeof ok(bad), 'symbol', `should reject ${String(bad).slice(0, 30)}`); // INVALID sentinel
  }
});

test('address phone is validated', () => {
  assert.ok(sanitize({ street: 'Main St', city: 'Kathmandu', phone: 'abc' }, addressSpec).error);
  assert.equal(sanitize({ street: 'Main St', city: 'Kathmandu', phone: '9812345678' }, addressSpec).error, undefined);
});
