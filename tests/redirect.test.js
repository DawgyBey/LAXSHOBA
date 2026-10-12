import test from 'node:test';
import assert from 'node:assert/strict';
import { safeRedirect as client } from '../src/lib/redirect.js';
import { safeRedirect as server } from '../server/lib/validate.js';

const cases = ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '/ok\nx', 'evil', '', null, undefined, 5, '/checkout', '/profile?order=1', '/a'.repeat(300)];
test('client and server redirect rules agree and block external targets', () => {
  for (const c of cases) assert.equal(client(c, '/x'), server(c, '/x'), String(c).slice(0, 30));
  assert.equal(client('//evil.com', '/profile'), '/profile');
  assert.equal(client('/profile?order=1', '/'), '/profile?order=1');
});
