import { useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

// Wrap routes that need a signed-in user (profile, checkout).
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  // If someone signs out while on a protected page, send them home rather than to the login screen.
  const wasSignedIn = useRef(false);
  if (user) wasSignedIn.current = true;

  if (loading) return <Loading />;
  if (user) return <Outlet />;
  // Otherwise remember the page so Login can send the person back after signing in.
  return <Navigate to={wasSignedIn.current ? '/' : '/login'} replace state={{ from: `${location.pathname}${location.search}` }} />;
}

// Wrap routes under /admin. Only an admin account gets in; everyone else (signed out or a customer) is sent to the
// 404 page so the panel does not advertise itself. The owner signs in at /admin-login (not linked anywhere).
// The API enforces the same rule server-side; this just keeps the UI, and the admin code bundle, away from visitors.
export function RequireAdmin() {
  const { user, isAdmin, loading } = useAuth();
  const wasAdmin = useRef(false);
  if (user && isAdmin) wasAdmin.current = true;

  if (loading) return <Loading />;
  if (user && isAdmin) return <Outlet />;
  // An admin whose session just expired goes back to the admin sign-in instead of seeing a 404.
  if (!user && wasAdmin.current) return <Navigate to="/admin-login" replace state={{ from: '/admin' }} />;
  return <Navigate to="/404" replace />;
}
