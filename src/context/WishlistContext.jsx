import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { getWishlist, saveWishlist } from '../lib/data';

const WishlistContext = createContext(null);

// Loads the signed-in customer's wishlist once, so every product card can show a
// filled or empty heart without making its own request.
export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!uid) { setIds(new Set()); return undefined; }
    let cancelled = false;
    getWishlist()
      .then((products) => { if (!cancelled) setIds(new Set(products.map((p) => p.id))); })
      .catch((err) => console.error('Could not load wishlist:', err));
    return () => { cancelled = true; };
  }, [uid]);

  const setSaved = useCallback((id, saved) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  // Optimistic: flip the heart now, put it back if saving fails. Returns the new state.
  const toggle = useCallback(async (id) => {
    const next = !ids.has(id);
    setSaved(id, next);
    try {
      await saveWishlist(id, next);
      return next;
    } catch (err) {
      setSaved(id, !next);
      throw err;
    }
  }, [ids, setSaved]);

  const value = useMemo(() => ({ has: (id) => ids.has(id), toggle }), [ids, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
