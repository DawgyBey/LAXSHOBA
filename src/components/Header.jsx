import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BRAND_NAME, NAV_LINKS, PLACEHOLDER } from '../lib/constants';

export default function Header() {
  const { user, loading } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navLinks = NAV_LINKS;

  // Close the mobile menu whenever the user navigates.
  useEffect(() => setMenuOpen(false), [location.key]);

  let accountLabel = '';
  if (!loading) accountLabel = user ? (user.name ? user.name.split(' ')[0] : 'Profile') : 'Login';

  return (
    <header className={`site-header${location.pathname === '/' ? ' site-header-home' : ''}`}>
      <div className="container">
        <Link to="/" className="logo">{BRAND_NAME}</Link>

        <nav className={`main-nav${menuOpen ? ' open' : ''}`}>
          <ul>
            {navLinks.map((link) => (
              <li key={link.to} className={link.optional ? 'nav-optional' : undefined}><Link to={link.to}>{link.label}</Link></li>
            ))}
            {user && <>
              <li><Link className={location.pathname === '/profile' ? 'active' : undefined} to="/profile">My Account</Link></li>
              <li><Link to="/profile?tab=orders">My Orders</Link></li>
            </>}
          </ul>
        </nav>

        <div className="header-actions">
          <Link to="/shop" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <Link className="icon-link" to={user ? '/profile' : '/login'} aria-label={accountLabel || 'Account'}>
            {user ? <img className="header-avatar" src={user.photoURL || PLACEHOLDER.avatar} alt="" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c.8-3.3 3-5 6.5-5s5.7 1.7 6.5 5" />
            </svg>}
            <span className="sr-only">{accountLabel || 'Account'}</span>
          </Link>
          <Link className="icon-link" to="/cart" aria-label={`Cart${count > 0 ? `, ${count} items` : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 8.5h14l-1 11H6l-1-11Z" /><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
            </svg>
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          <button className="nav-toggle" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>&#9776;</button>
        </div>
      </div>
    </header>
  );
}
