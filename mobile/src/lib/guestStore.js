import * as SecureStore from 'expo-secure-store';
import { SAVED_REPORTS_KEY, parseSavedReports, rememberReport } from './guestReport.js';

// SecureStore keys allow only letters, digits, ".", "-" and "_", which the shared key already uses.
// The tracking link is the only key to a guest report, so the list is kept in the keystore, not in plain storage.

/** Reports made on this phone without an account, newest first. Never throws. */
export async function loadSavedReports() {
  try {
    return parseSavedReports(await SecureStore.getItemAsync(SAVED_REPORTS_KEY));
  } catch {
    return [];
  }
}

/** Adds one { token, reference } to the saved list. A keystore failure only loses the shortcut. */
export async function saveReport(entry) {
  try {
    const list = await loadSavedReports();
    const next = rememberReport(list, { ...entry, savedAt: Date.now() });
    await SecureStore.setItemAsync(SAVED_REPORTS_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('[guest] could not save the report on this phone:', error.message);
  }
}
