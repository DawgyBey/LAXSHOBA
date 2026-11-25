import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Toaster from './Toaster';
import { BRAND_NAME } from '../lib/constants';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Home', icon: '▦', end: true },
  { to: '/admin/orders', label: 'Orders', icon: '⇄' },
  { to: '/admin/products', label: 'Products', icon: '◇' },
  { to: '/admin/categories', label: 'Categories', icon: '◫' },
  { to: '/admin/settings', label: 'Website Homepage', icon: '⌂' },
  { to: '/admin/pages', label: 'Info Pages', icon: '◌' },
];

const DEVELOPER_LINKS = [
  { to: '/admin/developer', label: 'Developer tools', icon: '⌘' },
  { to: '/admin/help', label: 'Help', icon: '?' },
];

const PAGE_TITLES = {
  '/admin': 'Home',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/settings': 'Website Homepage',
  '/admin/pages': 'Info Pages',
  '/admin/developer': 'Developer tools',
  '/admin/help': 'Help',
};

export default function AdminLayout() {
  const location = useLocation();
  useEffect(() => {
    document.body.classList.add('admin-body');
    return () => document.body.classList.remove('admin-body');
  }, []);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Link to="/admin" className="logo">{BRAND_NAME}<span>shop admin</span></Link>
        </div>
        <p className="admin-sidebar-intro">Here is what needs your attention today.</p>
        <nav className="admin-nav">
          {ADMIN_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}><span className="nav-icon" aria-hidden="true">{l.icon}</span>{l.label}</NavLink>
          ))}
        </nav>

        <details className="admin-advanced" open>
          <summary>Advanced</summary>
          <nav className="admin-nav advanced-nav">
            {DEVELOPER_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={location.pathname === l.to ? 'active' : ''}><span className="nav-icon" aria-hidden="true">{l.icon}</span>{l.label}</NavLink>
            ))}
          </nav>
        </details>

        <div className="sidebar-footer">
          <span className="presence-dot" /> Secure session
          <Link to="/" className="back-link">Visit storefront <span aria-hidden="true">↗</span></Link>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-header">
          <div>
            <span className="admin-header-eyebrow">{location.pathname === '/admin/developer' ? 'Developer tools' : 'Shop admin'}</span>
            <span className="admin-header-title">{PAGE_TITLES[location.pathname] || 'Shop admin'}</span>
          </div>
          <div className="admin-header-actions">
            <Link to="/admin/help" className="admin-visit-link">Help</Link>
            <Link to="/" className="admin-visit-link">Visit website <span aria-hidden="true">↗</span></Link>
          </div>
        </header>
        <main className="admin-main"><Outlet /></main>
      </div>
      <Toaster />
    </div>
  );
}
