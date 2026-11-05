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

/** Registers this phone for pushes after sign-in, and again if Expo changes the token; sign-out unregisters it. */
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
