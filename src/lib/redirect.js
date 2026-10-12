// Only same-origin absolute paths are accepted as post-login destinations (blocks //host, schemes, backslashes).
export function safeRedirect(target, fallback = '/') {
  if (typeof target !== 'string' || target.length > 512) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(target)) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}
