// Small display helpers shared across pages.

export const effectivePrice = (p) => p.salePrice || p.price;

export const formatPrice = (n) => `Rs. ${n}`;

// "Order #A1B2C3D4" style short id from a Mongo document id.
export const shortOrderId = (id) => `#${id.slice(0, 8).toUpperCase()}`;

// Date-like value -> local date string. Returns '' if the value is missing.
export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '');

export const firstImage = (p, fallback) => (p.images && p.images[0]) || fallback;

// "S, M , L" -> ['S', 'M', 'L']
export const splitList = (val) => val.split(',').map((s) => s.trim()).filter(Boolean);

export const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
