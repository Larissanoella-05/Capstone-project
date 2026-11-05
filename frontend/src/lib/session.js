/**
 * Restores the user for the saved token; only a 401 forgets it, so an unreachable server can be retried on reload.
 * @param {{ api: (path: string) => Promise<{ user: object }>, tokenStore: { get: () => string | null, clear: () => void } }} deps
 */
export async function restoreSession({ api, tokenStore }) {
  if (!tokenStore.get()) return null;
  try {
    return (await api('/auth/me')).user;
  } catch (error) {
    if (error.status === 401) tokenStore.clear();
    return null;
  }
}
