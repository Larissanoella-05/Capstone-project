import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api.js';

const AuthContext = createContext(null);

export const HOME_BY_ROLE = {
  CUSTOMER: '/customer',
  TECHNICIAN: '/technician',
  COORDINATOR: '/coordinator',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  // Restore the session when the tab is reloaded.
  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let cancelled = false;
    api('/auth/me')
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // The API wrapper fires this when a token is rejected.
  useEffect(() => {
    const onSignedOut = () => setUser(null);
    window.addEventListener('umuriro:signed-out', onSignedOut);
    return () => window.removeEventListener('umuriro:signed-out', onSignedOut);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
