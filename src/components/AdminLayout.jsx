import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Toaster from './Toaster';
import { BRAND_NAME } from '../lib/constants';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', icon: '▦', end: true },
  { to: '/admin/orders', label: 'Transactions', icon: '⇄' },
  { to: '/admin/products', label: 'Products', icon: '◇' },
  { to: '/admin/categories', label: 'Collections', icon: '◫' },
  { to: '/admin/settings', label: 'Storefront', icon: '⌂' },
  { to: '/admin/pages', label: 'Pages & SEO', icon: '◌' },
];

const DEVELOPER_LINKS = [
  { to: '/admin/developer', label: 'Operations console', icon: '⌘' },
];

export default function AdminLayout() {
  const location = useLocation();
  // admin.css styles `body.admin-body`, so toggle that class while in the admin area.
  useEffect(() => {
    document.body.classList.add('admin-body');
    return () => document.body.classList.remove('admin-body');
  }, []);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Link to="/admin" className="logo">{BRAND_NAME}<span>control room</span></Link>
        </div>
        <div className="admin-sidebar-section">Admin workspace</div>
        <nav className="admin-nav">
          {ADMIN_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}><span className="nav-icon" aria-hidden="true">{l.icon}</span>{l.label}</NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-section developer-section">Developer</div>
        <nav className="admin-nav">
          {DEVELOPER_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={location.pathname === l.to ? 'active' : ''}><span className="nav-icon" aria-hidden="true">{l.icon}</span>{l.label}<span className="nav-badge">LIVE</span></NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="presence-dot" /> Secure session
          <Link to="/" className="back-link">Visit storefront <span aria-hidden="true">↗</span></Link>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-header">
          <div><span className="admin-header-eyebrow">{location.pathname === '/admin/developer' ? 'Developer workspace' : 'Admin workspace'}</span><span className="admin-header-title">{location.pathname === '/admin/developer' ? 'Transaction operations' : 'Store control center'}</span></div>
          <div className="admin-header-actions"><span className="header-live"><i />System live</span><Link to="/" className="admin-visit-link">Visit website <span aria-hidden="true">↗</span></Link></div>
        </header>
        <main className="admin-main"><Outlet /></main>
      </div>
      <Toaster />
    </div>
  );
}
