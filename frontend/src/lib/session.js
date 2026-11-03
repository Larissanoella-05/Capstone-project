/**
 * Looks up the signed-in user for the token saved in this tab, after a page reload.
 * Returns null when there is no token or it cannot be used. Only a token the server rejected (401) is
 * forgotten; if the server was just unreachable or slow, the token stays so a reload can try again.
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
