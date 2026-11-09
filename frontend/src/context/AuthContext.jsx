import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api.js';
import { restoreSession } from '../lib/session.js';

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
    restoreSession({ api, tokenStore })
      .then((restored) => !cancelled && restored && setUser(restored))
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

  const startSession = useCallback((data) => {
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  /** `identifier` is an email address or a phone number. */
  const login = useCallback(
    async (identifier, password) =>
      startSession(await api('/auth/login', { method: 'POST', body: { identifier, password } })),
    [startSession]
  );

  /** Creates a customer account and signs it in. `body` comes from buildRegisterPayload. */
  const register = useCallback(
    async (body) => startSession(await api('/auth/register', { method: 'POST', body })),
    [startSession]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
