import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BRAND_NAME, NAV_LINKS, PLACEHOLDER } from '../lib/constants';

const isActive = (link, location) =>
  link.to.includes('?')
    ? location.pathname + location.search === link.to
    : location.pathname === link.to && !location.search;

export default function Header() {
  const { user, loading } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Close the mobile menu whenever the user navigates.
  useEffect(() => setMenuOpen(false), [location.key]);

  let accountLabel = '';
  if (!loading) accountLabel = user ? (user.name ? user.name.split(' ')[0] : 'Profile') : 'Login';

  function search(event) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  }

  return (
    <header className="hdr">
      <div className="container hdr-top">
        <button className="hdr-menu" type="button" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <Link to="/" className="hdr-logo">{BRAND_NAME}</Link>

        <form className="hdr-search" role="search" onSubmit={search}>
          <label className="sr-only" htmlFor="site-search">Search products</label>
          <input id="site-search" type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="submit" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>

        <div className="hdr-actions">
          <Link className="hdr-action" to={user ? '/profile?tab=wishlist' : '/login'} aria-label="Wishlist">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20.5s-7.5-4.6-7.5-10A4.4 4.4 0 0 1 12 7.8a4.4 4.4 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10Z" />
            </svg>
            <span className="sr-only">Wishlist</span>
          </Link>
          <Link className="hdr-action" to={user ? '/profile' : '/login'} aria-label={accountLabel || 'Account'}>
            {user
              ? <img className="header-avatar" src={user.photoURL || PLACEHOLDER.avatar} alt="" />
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><circle cx="12" cy="8" r="3.6" /><path d="M5.2 20c.9-3.4 3.2-5.2 6.8-5.2s5.9 1.8 6.8 5.2" /></svg>}
            <span className="sr-only">{accountLabel || 'Account'}</span>
          </Link>
          <Link className="hdr-action hdr-cart" to="/cart" aria-label={`Bag${count > 0 ? `, ${count} items` : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8.5h14l-1 11H6l-1-11Z" /><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
            </svg>
            <span className="sr-only">Bag</span>
            {count > 0 && <b className="hdr-count">{count}</b>}
          </Link>
        </div>
      </div>

      <nav className={`hdr-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main">
        <ul className="container">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className={`${isActive(link, location) ? 'active' : ''}${link.highlight ? ' hdr-sale' : ''}`.trim() || undefined}>
                {link.label}
              </Link>
            </li>
          ))}
          {user && (
            <>
              <li className="hdr-nav-extra"><Link to="/profile">My account</Link></li>
              <li className="hdr-nav-extra"><Link to="/profile?tab=orders">My orders</Link></li>
            </>
          )}
        </ul>
      </nav>
      {menuOpen && <button className="hdr-backdrop" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
