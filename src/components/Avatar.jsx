import { useEffect, useState } from 'react';

// Round profile picture that never shows a broken-image icon: if there is no picture, or it
// fails to load (expired Google URL, blocked host, corrupt data), the customer's initials are shown.
function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function Avatar({ src, name, className = '', alt = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  if (src && !failed) {
    return (
      <img
        className={className}
        src={src}
        alt={alt}
        // Google profile photos are often refused when a Referer header is sent.
        referrerPolicy="no-referrer"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  const initials = initialsOf(name);
  return (
    <span
      className={`${className} avatar-fallback`}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {initials || (
        <svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.9-3.6 3.3-5.4 7-5.4s6.1 1.8 7 5.4" />
        </svg>
      )}
    </span>
  );
}
