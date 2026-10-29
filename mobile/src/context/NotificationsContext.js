import * as Notifications from 'expo-notifications';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi.js';

const NotificationsContext = createContext(null);

/**
 * One shared copy of the signed-in user's notifications for a role's tabs, so the Alerts badge, the header
 * bell and the Alerts screen read the same data and only one request polls. It also refreshes at once when a
 * push arrives while the app is open.
 */
export function NotificationsProvider({ children }) {
  const state = useApi('/notifications', { interval: 6000 });
  const { reload } = state;

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => reload());
    return () => subscription.remove();
  }, [reload]);

  const value = useMemo(() => ({ ...state, unread: state.data?.unread ?? 0 }), [state]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return context;
}
