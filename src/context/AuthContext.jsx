import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true until the server has checked the signed session cookie.
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const role = user?.role || null; // display/routing hint only; every protected API call is authorised by the server.

  useEffect(() => {
    api.get('/auth/me')
      .then(({ user: nextUser }) => setUser(nextUser))
      .catch((err) => { console.error('Could not load session:', err); setSessionError(err.message); })
      .finally(() => setLoading(false));
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const start = useCallback(async (path, payload) => {
    const result = await api.post(path, payload);
    setUser(result.user);
    setSessionError('');
    return result.user;
  }, []);

  const signIn = (email, password) => start('/auth/login', { email, password });
  const signInWithGoogle = (credential) => start('/auth/google', { credential });
  const register = (name, email, password, profile) => start('/auth/register', { name, email, password, ...profile });

  // If the server cannot confirm the logout the cookie may still be valid, so keep the UI state honest and surface the error.
  async function signOut() {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
      if (err.status !== 401) throw new Error('We could not sign you out. Please try again.');
    }
    setUser(null);
  }

  const value = { user, role, isAdmin: role === 'admin', loading, sessionError, signIn, signInWithGoogle, register, signOut, updateUser: setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
