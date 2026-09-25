import { useEffect } from 'react';
import { getPage } from '../lib/data';

function usePageSEO(slug, fallbackTitle, fallbackDescription) {
  useEffect(() => {
    let active = true;
    getPage(slug).then((page) => {
      if (!active) return;
      document.title = page.metaTitle || fallbackTitle;
      if (page.metaDescription) {
        let description = document.querySelector('meta[name="description"]');
        if (!description) {
          description = document.createElement('meta');
          description.name = 'description';
          document.head.appendChild(description);
        }
        description.content = page.metaDescription;
      }
    }).catch(() => {
      if (active) document.title = fallbackTitle;
    });
    return () => { active = false; };
  }, [slug, fallbackTitle, fallbackDescription]);
}

export default usePageSEO;
