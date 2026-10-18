// Explicit field allowlists + type/length validation for every write endpoint. Pure; no dependencies.
import { isValidPhone, MAX_AVATAR_DATA_CHARS } from '../../src/lib/validation.js';
const INVALID = Symbol('invalid');
const isStr = (v) => typeof v === 'string';
// eslint-disable-next-line no-control-regex
const stripCtl = (s) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');

export const text = (max, { min = 0, multiline = false } = {}) => (v) => {
  if (!isStr(v)) return INVALID;
  const s = (multiline ? stripCtl(v) : v.replace(/[\u0000-\u001f\u007f]/g, ' ')).trim();
  return s.length < min || s.length > max ? INVALID : s;
};
export const num = ({ min = 0, max = 1e8, nullable = false } = {}) => (v) => {
  if (v === null || v === '') return nullable ? null : INVALID;
  const n = typeof v === 'number' ? v : Number.NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : INVALID;
};
export const int = (opts) => (v) => { const n = num(opts)(v); return n === INVALID || n === null || Number.isInteger(n) ? n : INVALID; };
export const bool = () => (v) => (typeof v === 'boolean' ? v : INVALID);
export const slug = () => (v) => { const s = isStr(v) ? v.trim().toLowerCase() : ''; return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 80 ? s : INVALID; };
export const objectIdOrNull = () => (v) => (v === null || v === '' ? null : isStr(v) && /^[a-f\d]{24}$/i.test(v) ? v : INVALID);
// Image/asset reference: site-relative path, https URL, or an inline raster data URI. Blocks javascript:, //host, svg data URIs.
export const imageRef = () => (v) => {
  if (!isStr(v)) return INVALID;
  const s = v.trim();
  if (s === '') return '';
  if (s.length > 2_000_000) return INVALID;
  if (/^\/(?!\/)[^\\\s]*$/.test(s) && s.length <= 2000) return s;
  if (/^https:\/\/[^\s]+$/.test(s) && s.length <= 2000) return s;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(s)) return s;
  return INVALID;
};
// Phone number: normalised whitespace, 7-15 digits (same rule as the browser forms).
export const phone = () => (v) => { if (!isStr(v)) return INVALID; const s = v.replace(/\s+/g, ' ').trim(); return isValidPhone(s) ? s : INVALID; };
// Profile picture: an https URL (Google) or a small raster data URI. Never SVG, never javascript:, never a path.
export const avatarRef = () => (v) => {
  if (!isStr(v)) return INVALID;
  const s = v.trim();
  if (s === '') return '';
  if (/^https:\/\/[^\s]+$/.test(s) && s.length <= 2000) return s;
  if (s.length <= MAX_AVATAR_DATA_CHARS && /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(s)) return s;
  return INVALID;
};
export const list = (item, { maxItems = 50 } = {}) => (v) => {
  if (!Array.isArray(v) || v.length > maxItems) return INVALID;
  const out = [];
  for (const el of v) { const r = item(el); if (r === INVALID) return INVALID; out.push(r); }
  return out;
};

export function sanitize(body, spec, { partial = false } = {}) {
  const src = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const value = {};
  for (const [key, { parse, required }] of Object.entries(spec)) {
    if (!Object.prototype.hasOwnProperty.call(src, key)) {
      if (!partial && required) return { error: `${key} is required` };
      continue;
    }
    const parsed = parse(src[key]);
    if (parsed === INVALID) return { error: `${key} is invalid` };
    value[key] = parsed;
  }
  return { value };
}
const f = (parse, required = false) => ({ parse, required });

export const productSpec = {
  name: f(text(200, { min: 1 }), true), price: f(num({ max: 1e7 }), true), salePrice: f(num({ max: 1e7, nullable: true })),
  stock: f(int({ max: 1e6 })), description: f(text(5000, { multiline: true })), review: f(text(2000, { multiline: true })),
  fabric: f(text(200)), categoryId: f(text(100)), categorySlug: f(text(100)),
  sizes: f(list(text(30))), colors: f(list(text(50))), occasion: f(list(text(50))),
  isHotPick: f(bool()), isFeatured: f(bool()), published: f(bool()), images: f(list(imageRef(), { maxItems: 20 })),
};
export const categorySpec = { name: f(text(100, { min: 1 }), true), slug: f(slug(), true), parentId: f(objectIdOrNull()), image: f(imageRef()) };
export const pageSpec = {
  slug: f(slug(), true), name: f(text(100, { min: 1 }), true), title: f(text(200)), metaTitle: f(text(200)), metaDescription: f(text(400)),
  content: f(text(100_000, { multiline: true })), published: f(bool()),
};
export const homepageSpec = {
  heroTitle: f(text(300)), heroDescription: f(text(2000, { multiline: true })), heroImage: f(imageRef()), aboutText: f(text(10_000, { multiline: true })),
  aboutImage: f(imageRef()), featuredProductIds: f(list(text(40), { maxItems: 50 })), scanTitle: f(text(300)),
  scanDescription: f(text(2000, { multiline: true })), scanProductIds: f(list(text(40), { maxItems: 50 })),
};
export const addressSpec = { label: f(text(50)), street: f(text(200, { min: 1 }), true), city: f(text(100, { min: 1 }), true), phone: f(phone(), true) };
export const profileSpec = { name: f(text(100, { min: 2 }), true), phone: f(phone(), true), photoURL: f(avatarRef()) };
export const checkoutSpec = { customerName: f(text(100, { min: 1 }), true), paymentMethod: f(text(20, { min: 1 }), true) };

// Cart persistence: display fields only. Prices are re-read from the DB at order time.
export function sanitizeCartLines(items) {
  if (!Array.isArray(items) || items.length > 50) return null;
  const out = [];
  for (const l of items) {
    const productId = text(40, { min: 1 })(l?.productId); const quantity = int({ min: 1, max: 20 })(l?.quantity);
    if (productId === INVALID || quantity === INVALID) return null;
    const optText = (v, max) => (v == null ? '' : text(max)(v));
    const name = optText(l.name, 200); const image = l.image ? imageRef()(l.image) : ''; const size = optText(l.size, 30); const color = optText(l.color, 50);
    const price = l.price == null ? 0 : num({ max: 1e7 })(l.price);
    if ([name, image, size, color, price].includes(INVALID)) return null;
    out.push({ productId, name, image, price, size, color, quantity });
  }
  return out;
}
