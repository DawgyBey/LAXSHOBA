// Origin/CSRF checks, security headers, and a small in-memory rate limiter. No dependencies.
import crypto from 'node:crypto';

export function parseOrigins(csv) {
  return new Set(String(csv || '').split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean));
}

// Exact-match origin check for state-changing requests. A missing Origin is only accepted when the
// browser declares the request same-origin / user-initiated via Sec-Fetch-Site.
export function originAllowed(headers, trusted) {
  const origin = headers.origin;
  if (origin) return trusted.has(origin);
  const site = headers['sec-fetch-site'];
  return site === 'same-origin' || site === 'none';
}

export function csrfEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export const newCsrfToken = () => crypto.randomBytes(32).toString('hex');

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export function csrfProtection({ trusted, cookieName = 'csrf', headerName = 'x-csrf-token' }) {
  return (req, res, next) => {
    if (!UNSAFE.has(req.method)) return next();
    if (!originAllowed(req.headers, trusted)) return res.status(403).json({ error: 'Request origin not allowed' });
    if (!csrfEqual(req.cookies?.[cookieName], req.headers[headerName])) return res.status(403).json({ error: 'Invalid CSRF token' });
    next();
  };
}

export function securityHeaders({ isProduction }) {
  return (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // Google sign-in popup
    if (isProduction) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    // CSP allows Google Identity Services + Google Fonts; images may be any https/data (admin-managed URLs).
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
      "script-src 'self' https://accounts.google.com", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
      "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob: https:", "connect-src 'self' https://accounts.google.com",
      "frame-src https://accounts.google.com",
    ].join('; '));
    next();
  };
}

// Fixed-window limiter. Single-process only: use a shared store (e.g. Redis) when running >1 instance.
export function rateLimiter({ windowMs, max, keyFn = (req) => req.ip, now = () => Date.now() }) {
  const hits = new Map();
  const sweep = setInterval(() => { const t = now(); for (const [k, v] of hits) if (v.reset <= t) hits.delete(k); }, windowMs);
  sweep.unref?.();
  const middleware = (req, res, next) => {
    const key = keyFn(req); const t = now();
    let entry = hits.get(key);
    if (!entry || entry.reset <= t) { entry = { count: 0, reset: t + windowMs }; hits.set(key, entry); }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - t) / 1000));
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    next();
  };
  middleware.hits = hits;
  return middleware;
}
