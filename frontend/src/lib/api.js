// One small wrapper around fetch for every call to the Express API.

const API_ROOT = `${(import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')}/api`;
const TOKEN_KEY = 'umuriro.token';

// sessionStorage is per browser tab, so three tabs can be signed in as three roles at once.
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Cannot reach the server. Check your connection and that the API is running.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Empty or non-JSON body; handled below.
  }

  if (!response.ok) {
    const message = payload?.error?.message || `The request failed (${response.status}).`;
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      tokenStore.clear();
      window.dispatchEvent(new Event('umuriro:signed-out'));
    }
    throw new ApiError(response.status, message, payload?.error?.details);
  }
  return payload;
}
