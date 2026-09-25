import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  // true until the server has checked the signed session cookie.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ user: nextUser }) => { setUser(nextUser); setRole(nextUser?.role || null); })
      .catch((err) => console.error('Could not load session:', err))
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email, password) {
    const result = await api.post('/auth/login', { email, password });
    setUser(result.user);
    setRole(result.user.role);
    return result.user;
  }

  async function signInWithGoogle(credential) {
    const result = await api.post('/auth/google', { credential });
    setUser(result.user);
    setRole(result.user.role);
    return result.user;
  }

  async function register(name, email, password, profile) {
    const result = await api.post('/auth/register', { name, email, password, ...profile });
    setUser(result.user);
    setRole(result.user.role);
    return result.user;
  }

  async function signOut() {
    await api.post('/auth/logout', {});
    setUser(null);
    setRole(null);
  }

  function updateUser(nextUser) {
    setUser(nextUser);
    setRole(nextUser?.role || null);
  }

  const value = { user, role, isAdmin: role === 'admin', loading, signIn, signInWithGoogle, register, signOut, updateUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
