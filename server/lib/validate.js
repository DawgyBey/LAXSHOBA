// Pure validation/normalisation helpers (no I/O, no dependencies) so they are unit-testable.
export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
// Allowed forward transitions. Delivered and Cancelled are terminal.
export const ORDER_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};
export const PAYMENT_METHODS = ['cod', 'bank'];

export const canTransition = (from, to) => Boolean(ORDER_TRANSITIONS[from]?.includes(to));
export const isObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);

export function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
}

// bcrypt only uses the first 72 bytes, so longer passwords are rejected rather than silently truncated.
export function validatePassword(value) {
  if (typeof value !== 'string') return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (Buffer.byteLength(value, 'utf8') > 72) return 'Password must be at most 72 bytes';
  return null;
}

export function cleanText(value, max = 200) {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

export function pick(source, allowed) {
  const out = {};
  if (!source || typeof source !== 'object') return out;
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(source, key)) out[key] = source[key];
  return out;
}

export function parsePagination(query, { defaultLimit = 50, maxLimit = 100 } = {}) {
  const limit = Math.min(Math.max(parseInt(query?.limit, 10) || defaultLimit, 1), maxLimit);
  const page = Math.max(parseInt(query?.page, 10) || 1, 1);
  return { limit, skip: (page - 1) * limit, page };
}

// Only same-origin absolute paths. Rejects //host, /\host, schemes, and control characters.
export function safeRedirect(target, fallback = '/') {
  if (typeof target !== 'string' || target.length > 512) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(target)) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}

// Admin = role "admin" in the database AND (when ADMIN_EMAILS is set) an email on that list.
// The list only ever narrows access; it never grants it. `allowed` is a Set of lowercase emails.
export function parseEmailList(csv) {
  return new Set(String(csv || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean));
}
export function isAdminAccount(user, allowed) {
  if (!user || user.role !== 'admin') return false;
  if (!allowed || allowed.size === 0) return true;
  return allowed.has(String(user.email || '').trim().toLowerCase());
}
