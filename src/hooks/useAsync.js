import { useEffect, useRef, useState } from 'react';

// Runs an async function on mount (and whenever `deps` change) and tracks its state.
//   const { data, loading, error, reload } = useAsync(() => fetchSomething(id), [id]);
// `data` keeps its previous value while a reload is in flight, so lists don't flicker.
export default function useAsync(fn, deps = []) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setState((s) => (s.loading ? { data: s.data, loading: false, error: s.error || new Error('Request timed out') } : s));
      }
    }, 6000);
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => { cancelled = true; clearTimeout(timeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
