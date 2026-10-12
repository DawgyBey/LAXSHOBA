import test from 'node:test';
import assert from 'node:assert/strict';
import { originAllowed, parseOrigins, csrfEqual, csrfProtection, rateLimiter } from '../server/lib/security.js';

const trusted = parseOrigins('https://shop.example.com/, http://localhost:5173');
test('origin must match exactly', () => {
  assert.ok(originAllowed({ origin: 'https://shop.example.com' }, trusted));
  for (const o of ['https://shop.example.com.evil.com', 'http://shop.example.com', 'https://evil.com', 'null']) assert.ok(!originAllowed({ origin: o }, trusted), o);
});
test('missing Origin only OK for same-origin/none fetch metadata', () => {
  assert.ok(originAllowed({ 'sec-fetch-site': 'same-origin' }, trusted));
  assert.ok(!originAllowed({ 'sec-fetch-site': 'cross-site' }, trusted));
  assert.ok(!originAllowed({}, trusted));
});
test('csrfEqual', () => { assert.ok(csrfEqual('abc', 'abc')); assert.ok(!csrfEqual('abc', 'abd')); assert.ok(!csrfEqual('', '')); assert.ok(!csrfEqual('a', undefined)); });
function run(mw, req) { let status = 0; let nexted = false; mw({ method: 'POST', headers: {}, cookies: {}, ...req }, { status(s) { status = s; return this; }, json() {}, setHeader() {} }, () => { nexted = true; }); return { status, nexted }; }
test('csrfProtection blocks missing/mismatched token and bad origin', () => {
  const mw = csrfProtection({ trusted });
  assert.equal(run(mw, { headers: { origin: 'https://shop.example.com' } }).status, 403);
  assert.equal(run(mw, { headers: { origin: 'https://shop.example.com', 'x-csrf-token': 'a' }, cookies: { csrf: 'b' } }).status, 403);
  assert.equal(run(mw, { headers: { origin: 'https://evil.com', 'x-csrf-token': 'a' }, cookies: { csrf: 'a' } }).status, 403);
  assert.ok(run(mw, { headers: { origin: 'https://shop.example.com', 'x-csrf-token': 'a' }, cookies: { csrf: 'a' } }).nexted);
  assert.ok(run(mw, { method: 'GET' }).nexted);
});
test('rateLimiter returns 429 after max and resets after the window', () => {
  let t = 0; const rl = rateLimiter({ windowMs: 1000, max: 2, now: () => t, keyFn: () => 'k' });
  const hit = () => run(rl, {});
  assert.ok(hit().nexted); assert.ok(hit().nexted); assert.equal(hit().status, 429);
  t = 1500; assert.ok(hit().nexted);
});
