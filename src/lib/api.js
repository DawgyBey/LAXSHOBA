const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const csrfToken = () => decodeURIComponent(document.cookie.match(/(?:^|; )csrf=([^;]*)/)?.[1] || '');

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { 'Content-Type': 'application/json', ...(UNSAFE.has(method) ? { 'X-CSRF-Token': csrfToken() } : {}), ...(options.headers || {}) };
  let response;
  try {
    response = await fetch(`/api${path}`, { credentials: 'include', ...options, headers });
  } catch {
    const error = new Error('Could not reach the server. Check your connection and try again.');
    error.status = 0;
    throw error;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    // The CSRF cookie may be missing/rotated: fetch a fresh one once, then retry.
    if (response.status === 403 && body.error === 'Invalid CSRF token' && !options._retried) {
      await fetch('/api/auth/me', { credentials: 'include' }).catch(() => {});
      return request(path, { ...options, _retried: true });
    }
    // An expired session on a protected call signs the UI out (AuthContext listens). Auth endpoints report their own errors.
    if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new CustomEvent('auth:expired'));
    const error = new Error(body.error || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
