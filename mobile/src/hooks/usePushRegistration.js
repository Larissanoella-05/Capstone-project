import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { api } from '../lib/api.js';
import { setRegisteredToken } from '../lib/deviceToken.js';
import { registerForPush } from '../lib/push.js';

async function registerWithServer(token) {
  try {
    await api('/devices', { method: 'POST', body: { token, platform: 'android' } });
    setRegisteredToken(token);
  } catch (error) {
    console.warn('[push] could not register this phone with the server:', error.message);
  }
}

/**
 * Once someone is signed in, registers this phone for pushes (and again if Expo changes the token).
 * Signing in as another user on the same phone registers the token for them: the server moves it.
 * Sign-out unregisters it (see AuthContext.logout).
 */
export function usePushRegistration(user) {
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    registerForPush().then((token) => {
      if (!cancelled && token) registerWithServer(token);
    });
    const subscription = Notifications.addPushTokenListener(({ data }) => {
      if (!cancelled && data) registerWithServer(data);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [userId]);
}
