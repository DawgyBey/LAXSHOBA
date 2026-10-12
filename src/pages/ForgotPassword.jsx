import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function ForgotPassword() {
  useDocumentTitle('Reset password — LAXSHOBHA');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError(''); setBusy(true);
    try { await api.post('/auth/password-reset/request', { email }); setDone(true); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <section className="section"><div className="container"><div className="auth-shell"><div className="auth-card">
      <div className="auth-card-head"><span className="eyebrow">Account help</span><h1 className="h2">Reset your password</h1></div>
      {done ? (
        <p role="status">If an account exists for that email, a reset link is on its way. The link expires in 30 minutes.</p>
      ) : (
        <form onSubmit={submit} noValidate={false}>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
      <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
    </div></div></div></section>
  );
}
