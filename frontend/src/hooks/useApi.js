import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

/** Loads data and, when `interval` is set, polls so the roles see each other's changes; returns { data, error, loading, fetchedAt, reload }. */
export function useApi(path, { interval = 0 } = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: Boolean(path),
    fetchedAt: null,
  });
  const activePath = useRef(path);

  const load = useCallback(
    async (silent = false) => {
      if (!path) return;
      if (!silent) setState((current) => ({ ...current, loading: true }));
      try {
        const data = await api(path);
        if (activePath.current === path)
          setState({ data, error: null, loading: false, fetchedAt: Date.now() });
      } catch (error) {
        if (activePath.current !== path) return;
        // On a background refresh keep showing the last good data instead of an error screen.
        setState((current) => ({
          data: silent ? current.data : null,
          error: silent && current.data ? null : error,
          loading: false,
          fetchedAt: current.fetchedAt,
        }));
      }
    },
    [path]
  );

  useEffect(() => {
    activePath.current = path;
    if (!path) {
      setState({ data: null, error: null, loading: false, fetchedAt: null });
      return undefined;
    }
    load(false);
    if (!interval) return undefined;
    const timer = setInterval(() => load(true), interval);
    return () => clearInterval(timer);
  }, [path, interval, load]);

  return { ...state, reload: () => load(true) };
}
