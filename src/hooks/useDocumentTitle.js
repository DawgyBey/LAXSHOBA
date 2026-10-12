import { useEffect } from 'react';

function ensureMeta(name, value, attr = 'name') {
  const selector = `${attr}="${name}"`;
  let tag = document.head.querySelector(`meta[${selector}]`);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', value);
}

// Sets the browser tab title and related SEO meta tags while the calling page is mounted.
export default function useDocumentTitle(title, { description, keywords } = {}) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      ensureMeta('description', description);
      ensureMeta('og:description', description, 'property');
      ensureMeta('twitter:description', description, 'name');
    }

    if (keywords) {
      ensureMeta('keywords', keywords);
    }
  }, [title, description, keywords]);
}
