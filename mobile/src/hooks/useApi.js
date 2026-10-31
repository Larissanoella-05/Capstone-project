import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api } from '../lib/api.js';

/**
 * Loads data from the API and, when `interval` is set, keeps it fresh by polling.
 * Polling runs only while the app is in the foreground and this screen is focused (tab screens stay
 * mounted when hidden), and it reloads once when either comes back.
 *
 * Returns { data, error, loading, reload }.
 */
export function useApi(path, { interval = 0 } = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: Boolean(path),
    offline: false,
  });
  const activePath = useRef(path);

  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) =>
      setAppActive(next === 'active')
    );
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  const load = useCallback(
    async (silent = false) => {
      if (!path) return;
      if (!silent) setState((current) => ({ ...current, loading: true }));
      try {
        const data = await api(path);
        if (activePath.current === path)
          setState({ data, error: null, loading: false, offline: false });
      } catch (error) {
        if (activePath.current !== path) return;
        // On a background refresh keep showing the last good data instead of an error screen,
        // but remember that the connection is down so the screen can say so.
        setState((current) => ({
          data: silent ? current.data : null,
          error: silent && current.data ? null : error,
          loading: false,
          offline: Boolean(silent && current.data && error.status === 0),
        }));
      }
    },
    [path]
  );

  // First load, and again whenever the path changes.
  useEffect(() => {
    activePath.current = path;
    if (!path) {
      setState({ data: null, error: null, loading: false, offline: false });
      return;
    }
    // Drop the previous record: dynamic routes reuse one screen, so job 7 must not show job 5 while it loads.
    setState({ data: null, error: null, loading: true, offline: false });
    load(false);
  }, [path, load]);

  const polling = Boolean(path && interval && appActive && focused);
  const wasPolling = useRef(polling);
  useEffect(() => {
    if (!polling) {
      wasPolling.current = false;
      return undefined;
    }
    // Coming back to the foreground or to this tab: refresh now instead of waiting a full interval.
    if (!wasPolling.current) load(true);
    wasPolling.current = true;
    const timer = setInterval(() => load(true), interval);
    return () => clearInterval(timer);
  }, [polling, interval, load]);

  return { ...state, reload: () => load(true) };
}
