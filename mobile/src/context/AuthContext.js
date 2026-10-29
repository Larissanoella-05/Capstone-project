import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api.js';
import { getRegisteredToken, setRegisteredToken } from '../lib/deviceToken.js';

const AuthContext = createContext(null);

// Coordinators work on the web app, so they have no home here.
export const HOME_BY_ROLE = {
  CUSTOMER: '/customer',
  TECHNICIAN: '/technician',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the saved session when the app starts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!(await tokenStore.get())) return;
        const data = await api('/auth/me');
        if (cancelled) return;
        if (data.user.role === 'COORDINATOR') await tokenStore.clear();
        else setUser(data.user);
      } catch {
        // A rejected token is already cleared by the API wrapper. A network failure leaves the
        // user on the login screen with the saved token, so the next start can try again.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The API wrapper calls this when a token is rejected.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password, client: 'mobile' } });
    if (data.user.role === 'COORDINATOR') {
      throw new Error('Coordinators use the web app.');
    }
    await tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    // Stop pushes to this phone while the session is still valid; a failure must not block signing out.
    const pushToken = getRegisteredToken();
    if (pushToken) {
      try {
        await api('/devices', { method: 'DELETE', body: { token: pushToken } });
      } catch (error) {
        console.warn('[push] could not unregister this phone:', error.message);
      }
      setRegisteredToken(null);
    }
    await tokenStore.clear();
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
