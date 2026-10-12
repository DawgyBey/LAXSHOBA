import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import useDocumentTitle from '../hooks/useDocumentTitle';

// The token travels in the URL fragment (never sent to servers or logged) and is removed from the address bar on load.
export default function ResetPassword() {
  useDocumentTitle('Choose a new password — LAXSHOBHA');
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (window.location.hash) window.history.replaceState(null, '', window.location.pathname); }, []);

  async function submit(event) {
    event.preventDefault();
    setError(''); setBusy(true);
    try { await api.post('/auth/password-reset/confirm', { token, password }); navigate('/login', { replace: true, state: { notice: 'Password updated. Please sign in.' } }); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <section className="section"><div className="container"><div className="auth-shell"><div className="auth-card">
      <div className="auth-card-head"><span className="eyebrow">Account help</span><h1 className="h2">Choose a new password</h1></div>
      {!token ? (
        <p className="auth-error" role="alert">This reset link is missing its token. <Link to="/forgot-password">Request a new link</Link>.</p>
      ) : (
        <form onSubmit={submit}>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <label className="auth-field"><span>New password</span><input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
        </form>
      )}
    </div></div></div></section>
  );
}
