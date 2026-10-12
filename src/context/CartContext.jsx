import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  addLine, cartCount, cartTotal, clearGuestCart, mergeCarts,
  readGuestCart, readRemoteCart, writeGuestCart, writeRemoteCart,
} from '../lib/cart';

const CartContext = createContext(null);

// Loads the right cart for whoever is (or isn't) signed in. When a guest signs in,
// whatever they added while logged out is merged into their account cart.
async function loadCart(uid) {
  if (!uid) return readGuestCart();

  const remote = await readRemoteCart(uid);
  const guest = readGuestCart();
  if (guest.length === 0) return remote;

  const merged = mergeCarts(remote, guest);
  await writeRemoteCart(uid, merged);
  clearGuestCart();
  return merged;
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;

  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false); // false until the first load for this user finishes
  const inFlight = useRef({ key: null, promise: null });

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const key = uid ?? 'guest';
    setReady(false);

    // React StrictMode runs effects twice in development. Sharing one load per user
    // guarantees the guest-cart merge above can only ever happen once.
    if (inFlight.current.key !== key) {
      inFlight.current = { key, promise: loadCart(uid) };
    }

    inFlight.current.promise
      .then((loaded) => { if (!cancelled) setItems(loaded); })
      .catch((err) => { console.error('Could not load cart:', err); if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setReady(true); });

    return () => { cancelled = true; };
  }, [uid, authLoading]);

  // Optimistic update: show the change immediately, roll back if saving fails.
  async function persist(next) {
    const previous = items;
    setItems(next);
    try {
      if (uid) await writeRemoteCart(uid, next);
      else writeGuestCart(next);
    } catch (err) {
      setItems(previous);
      throw err;
    }
  }

  const value = {
    items,
    ready,
    count: cartCount(items),
    total: cartTotal(items),
    addItem: (line) => persist(addLine(items, line)),
    setQuantity: (index, quantity) =>
      persist(items.map((it, i) => (i === index ? { ...it, quantity: Math.max(1, quantity) } : it))),
    removeItem: (index) => persist(items.filter((_, i) => i !== index)),
    clearCart: () => persist([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
