import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { api } from '../lib/api.js';
import { useApi } from './useApi.js';

jest.mock('../lib/api.js', () => ({ api: jest.fn() }));

// There is no navigation container in a hook test; expose focus changes through a variable instead.
let mockFocusListeners = [];
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: (effect) => {
      React.useEffect(() => {
        const cleanup = effect();
        mockFocusListeners.push({ effect, cleanup });
        return cleanup;
      }, [effect]);
    },
  };
});

let appStateHandler;
let appStateRemove;

beforeEach(() => {
  jest.useFakeTimers();
  api.mockReset();
  api.mockResolvedValue({ n: 1 });
  mockFocusListeners = [];
  appStateRemove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    appStateHandler = handler;
    return { remove: appStateRemove };
  });
  AppState.currentState = 'active';
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function advance(ms) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

describe('useApi', () => {
  it('loads once and polls on the interval while the app is active', async () => {
    const { result } = await renderHook(() => useApi('/faults', { interval: 5000 }));
    await advance(0);
    expect(result.current.data).toEqual({ n: 1 });
    expect(api).toHaveBeenCalledTimes(1);

    await advance(5000);
    expect(api).toHaveBeenCalledTimes(2);
    await advance(5000);
    expect(api).toHaveBeenCalledTimes(3);
  });

  it('stops polling in the background and reloads on return', async () => {
    await renderHook(() => useApi('/faults', { interval: 5000 }));
    await advance(0);
    expect(api).toHaveBeenCalledTimes(1);

    await act(async () => appStateHandler('background'));
    await advance(20000);
    expect(api).toHaveBeenCalledTimes(1);

    await act(async () => appStateHandler('active'));
    await advance(0);
    expect(api).toHaveBeenCalledTimes(2);
  });

  it('stops polling when the screen loses focus', async () => {
    await renderHook(() => useApi('/faults', { interval: 5000 }));
    await advance(0);
    expect(api).toHaveBeenCalledTimes(1);

    await act(async () => mockFocusListeners[0].cleanup());
    await advance(20000);

    expect(api).toHaveBeenCalledTimes(1);
  });

  it('clears the old record while a new path loads', async () => {
    api.mockImplementation(async (path) => ({ path }));
    const { result, rerender } = await renderHook(({ path }) => useApi(path), {
      initialProps: { path: '/faults/5' },
    });
    await advance(0);
    expect(result.current.data).toEqual({ path: '/faults/5' });

    api.mockImplementation(() => new Promise(() => {}));
    await rerender({ path: '/faults/7' });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('does not poll without an interval', async () => {
    await renderHook(() => useApi('/service-locations'));
    await advance(30000);
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('keeps the last good data when a silent refresh fails', async () => {
    const { result } = await renderHook(() => useApi('/faults', { interval: 5000 }));
    await advance(0);
    api.mockRejectedValue(new Error('offline'));

    await advance(5000);

    expect(result.current.data).toEqual({ n: 1 });
    expect(result.current.error).toBeNull();
  });

  it('flags offline when a refresh fails with no connection, and clears it when the connection returns', async () => {
    const { result } = await renderHook(() => useApi('/faults', { interval: 5000 }));
    await advance(0);
    expect(result.current.offline).toBe(false);

    api.mockRejectedValue(Object.assign(new Error('Cannot reach the server.'), { status: 0 }));
    await advance(5000);
    expect(result.current.data).toEqual({ n: 1 });
    expect(result.current.offline).toBe(true);

    api.mockResolvedValue({ n: 2 });
    await advance(5000);
    expect(result.current.offline).toBe(false);
    expect(result.current.data).toEqual({ n: 2 });
  });

  it('does not flag offline for a server error during a refresh', async () => {
    const { result } = await renderHook(() => useApi('/faults', { interval: 5000 }));
    await advance(0);
    api.mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }));
    await advance(5000);
    expect(result.current.offline).toBe(false);
  });

  it('shows the error when the first load fails', async () => {
    api.mockRejectedValue(new Error('offline'));
    const { result } = await renderHook(() => useApi('/faults'));
    await advance(0);
    expect(result.current.data).toBeNull();
    expect(result.current.error.message).toBe('offline');
  });
});
