import { useEffect, useState } from 'react';
import { getHomepage } from '../lib/data';

// Reads homepageContent/main (hero, about text, featured product ids) — the one
// document the admin's "Homepage & Settings" page edits.
// Returns null while loading, then an object (empty if the admin hasn't saved anything yet).
export default function useHomepageContent() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setContent((value) => value ?? {});
    }, 6000);
    getHomepage()
      .then((value) => { if (!cancelled) setContent(value); })
      .catch((err) => { console.error('Could not load homepage content:', err); if (!cancelled) setContent({}); });
    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  return content;
}
