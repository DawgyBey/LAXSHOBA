// Cart storage + pure helpers. Logged-in users' carts live in the API; guests use localStorage.
import { getCart, saveCart } from './data';

const GUEST_KEY = 'guestCart';

export function readGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
  } catch {
    return [];
  }
}
export const writeGuestCart = (items) => localStorage.setItem(GUEST_KEY, JSON.stringify(items));
export const clearGuestCart = () => localStorage.removeItem(GUEST_KEY);

export async function readRemoteCart(uid) {
  return getCart();
}
export const writeRemoteCart = (uid, items) => saveCart(items);

// Two lines are "the same" if they're the same product in the same size and colour.
const sameLine = (a, b) =>
  a.productId === b.productId && (a.size || null) === (b.size || null) && (a.color || null) === (b.color || null);

// Adds one line to a cart, bumping the quantity if an identical line already exists.
export function addLine(items, line) {
  const i = items.findIndex((x) => sameLine(x, line));
  if (i === -1) return [...items, line];
  return items.map((x, idx) => (idx === i ? { ...x, quantity: x.quantity + line.quantity } : x));
}

export const mergeCarts = (base, extra) => extra.reduce(addLine, base);

export const cartCount = (items) => items.reduce((sum, i) => sum + i.quantity, 0);
export const cartTotal = (items) => items.reduce((sum, i) => sum + i.price * i.quantity, 0);
