import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const IGNORED_ERRORS = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export default function Login({ adminOnly = false }) {
  useDocumentTitle(adminOnly ? 'Admin Login — LAXSHOBHA' : 'Login — LAXSHOBHA');
  const { signIn, signInWithGoogle, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', street: '', city: '' });
  const googleButton = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const showGoogle = !adminOnly && !registering;

  useEffect(() => {
    if (adminOnly || registering || !googleClientId || !googleButton.current) return undefined;

    let cancelled = false;
    let timer;
    let initialized = false;
    function renderGoogleButton() {
      if (cancelled || initialized || !window.google?.accounts?.id || !googleButton.current) return false;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => handleGoogleSignIn(response.credential),
      });
      initialized = true;
      googleButton.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButton.current, {
        theme: 'outline',
        size: 'large',
        width: googleButton.current.offsetWidth,
        text: 'continue_with',
        shape: 'rectangular',
      });
      return true;
    }

    if (!renderGoogleButton()) timer = window.setInterval(renderGoogleButton, 100);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (googleButton.current) googleButton.current.replaceChildren();
    };
  }, [adminOnly, registering, googleClientId]);

  async function handleGoogleSignIn(credential) {
    if (adminOnly) {
      setError('Admin access is limited to approved email sign-in.');
      setBusy(false);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle(credential);
      navigate(location.state?.from || '/profile', { replace: true });
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError(err.message || 'Google sign-in did not work. Please try again.');
      setBusy(false);
    }
  }

  async function handleSignIn() {
    setError('');
    setBusy(true);
    try {
      if (adminOnly) {
        if (registering) {
          throw new Error('Admin access is limited to authorized email sign-in.');
        }
        const user = await signIn(form.email, form.password);
        if (user.role !== 'admin') {
          throw new Error('Only authorized email accounts can access the boutique admin area.');
        }
        navigate(location.state?.from || '/admin', { replace: true });
        return;
      }

      if (registering) await register(form.name, form.email, form.password, { phone: form.phone, street: form.street, city: form.city });
      else await signIn(form.email, form.password);
      // Send people back to where they were headed (e.g. checkout), otherwise to their profile.
      navigate(location.state?.from || '/profile', { replace: true });
    } catch (err) {
      if (!IGNORED_ERRORS.includes(err.code)) {
        console.error('Email sign-in failed:', err);
        setError(err.message || 'Authentication did not work. Please try again.');
      }
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        {adminOnly ? (
          <div className="auth-shell admin-auth-shell">
            <aside className="admin-auth-sidebar">
              <div className="admin-auth-brand">
                <div className="admin-auth-brand-mark">L</div>
                <div>
                  <span className="admin-auth-brand-name">LAXSHOBHA</span>
                </div>
              </div>

              <nav className="admin-auth-nav" aria-label="Admin navigation">
                <button type="button" className="admin-auth-nav-item active">Dashboard</button>
                <button type="button" className="admin-auth-nav-item">Homepage</button>
                <button type="button" className="admin-auth-nav-item">Pages</button>
                <button type="button" className="admin-auth-nav-item">Why Us</button>
                <button type="button" className="admin-auth-nav-item">Categories</button>
                <button type="button" className="admin-auth-nav-item">Packages</button>
                <button type="button" className="admin-auth-nav-item">Blog</button>
                <button type="button" className="admin-auth-nav-item">Trip Facts</button>
                <button type="button" className="admin-auth-nav-item">Trip FAQs</button>
              </nav>
            </aside>

            <div className="admin-auth-main">
              <header className="admin-auth-header">
                <div className="admin-auth-header-title">Dashboard</div>
                <button type="button" className="admin-auth-logout">Logout</button>
              </header>

              <div className="admin-auth-body">
                <div className="admin-auth-card">
                  <div className="auth-card-head">
                    <span className="eyebrow">Restricted</span>
                    <h2>Admin sign in</h2>
                  </div>

                  {error && <p className="auth-error" role="alert">{error}</p>}

                  <form onSubmit={(event) => { event.preventDefault(); handleSignIn(); }}>
                    <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" placeholder="you@example.com" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                    <label className="auth-field"><span>Password</span><input type="password" autoComplete="current-password" placeholder="Authorized password" required minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
                    <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
                      {busy ? 'Signing in...' : 'Access admin'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="auth-shell">
            <div className="auth-intro">
              <span className="eyebrow">A considered wardrobe</span>
              <h1>Come in,<br /><em>stay awhile.</em></h1>
              <p>Save your favourites, keep your cart close, and follow every order from our little boutique.</p>
              <div className="auth-rule" aria-hidden="true"><span>✦</span></div>
              <p className="auth-note">Handpicked traditional wear, chosen with an eye for the details that last.</p>
            </div>
            <div className="auth-card">
              <div className="auth-card-head">
                <span className="eyebrow">{registering ? 'New here' : 'Welcome back'}</span>
                <h2>{registering ? 'Create an account' : 'Sign in'}</h2>
              </div>
              {error && <p className="auth-error" role="alert">{error}</p>}
              {showGoogle && googleClientId && <div className="google-button-wrap" ref={googleButton} aria-label="Continue with Google" />}
              {showGoogle && !googleClientId && <div className="google-config-notice">Google sign-in is ready once <code>VITE_GOOGLE_CLIENT_ID</code> is added to <code>.env</code>.</div>}
              {showGoogle && <div className="auth-divider"><span>or continue with email</span></div>}
              <form onSubmit={(event) => { event.preventDefault(); handleSignIn(); }}>
                {!adminOnly && registering && <label className="auth-field"><span>Name</span><input type="text" autoComplete="name" placeholder="Your name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
                <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" placeholder="you@example.com" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                <label className="auth-field"><span>Password</span><input type="password" autoComplete={registering ? 'new-password' : 'current-password'} placeholder="8 characters or more" required minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
                {!adminOnly && registering && <>
                  <label className="auth-field"><span>Phone</span><input type="tel" autoComplete="tel" placeholder="Your phone number" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                  <label className="auth-field"><span>Street address</span><input type="text" autoComplete="street-address" placeholder="Delivery street address" required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></label>
                  <label className="auth-field"><span>City</span><input type="text" autoComplete="address-level2" placeholder="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
                </>}
                <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
                  {busy ? (registering ? 'Creating account...' : 'Signing in...') : (registering ? 'Create account' : 'Sign in')}
                </button>
              </form>
              {!adminOnly && <p className="auth-switch">{registering ? 'Already have an account?' : 'New to the boutique?'}{' '}<button type="button" onClick={() => { setRegistering(!registering); setError(''); }}> {registering ? 'Sign in' : 'Create an account'}</button></p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
