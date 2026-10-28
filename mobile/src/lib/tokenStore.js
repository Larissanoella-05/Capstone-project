import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'umuriro.token';

// Used only if the Android keystore refuses to read or write, so the app still works for this run.
let memoryToken = null;

export const tokenStore = {
  async get() {
    try {
      return (await SecureStore.getItemAsync(TOKEN_KEY)) ?? memoryToken;
    } catch {
      return memoryToken;
    }
  },
  async set(token) {
    memoryToken = token;
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.warn('[auth] could not save the session securely:', error.message);
    }
  },
  async clear() {
    memoryToken = null;
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.warn('[auth] could not clear the saved session:', error.message);
    }
  },
};
