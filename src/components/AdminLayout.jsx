import { useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BRAND_NAME } from '../lib/constants';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/settings', label: 'Homepage & Settings' },
  { to: '/admin/pages', label: 'Pages & SEO' },
];

export default function AdminLayout() {
  // admin.css styles `body.admin-body`, so toggle that class while in the admin area.
  useEffect(() => {
    document.body.classList.add('admin-body');
    return () => document.body.classList.remove('admin-body');
  }, []);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand"><Link to="/admin" className="logo">{BRAND_NAME}</Link></div>
        <div className="admin-sidebar-section">Store management</div>
        <nav>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </nav>
        <Link to="/" className="back-link">&larr; Back to site</Link>
      </aside>
      <div className="admin-workspace">
        <header className="admin-header">
          <span className="admin-header-title">{BRAND_NAME} Administration</span>
          <Link to="/" className="admin-visit-link">Visit website <span aria-hidden="true">↗</span></Link>
        </header>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
