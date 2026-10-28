// One small wrapper around fetch for every call to the Express API.
import { tokenStore } from './tokenStore.js';

const API_ROOT = `${(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')}/api`;

// Longer than the Render cold start (about a minute), so a sleeping server still answers.
const TIMEOUT_MS = 70000;

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let onUnauthorized = () => {};

/** The auth context registers a callback here; it runs when the server rejects the saved token. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler || (() => {});
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = {};
  const token = await tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  // One controller covers both the caller's cancel signal and our own timeout.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);

  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) throw new ApiError(0, 'The server took too long to answer. Try again.');
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
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
      await tokenStore.clear();
      onUnauthorized();
    }
    throw new ApiError(response.status, message, payload?.error?.details);
  }
  return payload;
}

export { tokenStore };
