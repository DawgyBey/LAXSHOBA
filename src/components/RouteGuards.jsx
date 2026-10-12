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

// Wrap routes under /admin. Signed-out -> login, signed-in non-admin -> home.
// The API enforces the same access checks server-side; this keeps the UI out of the way.
export function RequireAdmin() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/admin-login" replace state={{ from: '/admin' }} />;
  return isAdmin ? <Outlet /> : <Navigate to="/admin-login" replace state={{ from: '/admin' }} />;
}
