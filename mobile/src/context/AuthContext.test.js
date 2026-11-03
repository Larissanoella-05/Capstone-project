import { act, renderHook, waitFor } from '@testing-library/react-native';
import { api, tokenStore } from '../lib/api.js';
import { getRegisteredToken, setRegisteredToken } from '../lib/deviceToken.js';
import { AuthProvider, HOME_BY_ROLE, useAuth } from './AuthContext.js';

jest.mock('../lib/api.js', () => {
  const store = require('../lib/tokenStore.js');
  return {
    api: jest.fn(),
    setUnauthorizedHandler: jest.fn(),
    tokenStore: store.tokenStore,
  };
});

const user = (role, extra = {}) => ({ id: 1, name: 'Test', email: 't@demo.rw', role, ...extra });
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

async function renderAuth() {
  // RNTL 14 renders asynchronously, so renderHook must be awaited.
  const hook = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('AuthContext', () => {
  beforeEach(async () => {
    api.mockReset();
    // tokenStore keeps an in-memory copy beside the keystore; clear it so tests stay independent.
    await tokenStore.clear();
  });

  it.each(['CUSTOMER', 'TECHNICIAN'])('stores the token after a %s login', async (role) => {
    api.mockResolvedValue({ token: `token-${role}`, user: user(role) });
    const { result } = await renderAuth();

    await act(async () => {
      await result.current.login('t@demo.rw', 'demo1234');
    });

    expect(result.current.user.role).toBe(role);
    expect(await tokenStore.get()).toBe(`token-${role}`);
  });

  it('asks the API for a mobile session', async () => {
    api.mockResolvedValue({ token: 'x', user: user('CUSTOMER') });
    const { result } = await renderAuth();

    await act(async () => {
      await result.current.login('t@demo.rw', 'demo1234');
    });

    expect(api).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 't@demo.rw', password: 'demo1234', client: 'mobile' },
    });
  });

  it('refuses a coordinator, stores nothing and stays signed out', async () => {
    api.mockResolvedValue({ token: 'coordinator-token', user: user('COORDINATOR') });
    const { result } = await renderAuth();

    await act(async () => {
      await expect(result.current.login('grace@demo.rw', 'demo1234')).rejects.toThrow(
        'Coordinators use the web app.'
      );
    });

    expect(result.current.user).toBeNull();
    expect(await tokenStore.get()).toBeNull();
  });

  it('restores the session from a stored token through /auth/me', async () => {
    await tokenStore.set('saved');
    api.mockResolvedValue({ user: user('TECHNICIAN') });

    const { result } = await renderAuth();

    expect(api).toHaveBeenCalledWith('/auth/me');
    expect(result.current.user.role).toBe('TECHNICIAN');
  });

  it('does not call the API on start when nothing is stored', async () => {
    const { result } = await renderAuth();

    expect(api).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('clears the token on logout', async () => {
    api.mockResolvedValue({ token: 'x', user: user('CUSTOMER') });
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.login('t@demo.rw', 'demo1234');
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(await tokenStore.get()).toBeNull();
  });

  it('unregisters this phone for pushes before signing out', async () => {
    api.mockResolvedValue({ token: 'x', user: user('CUSTOMER') });
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.login('t@demo.rw', 'demo1234');
    });
    setRegisteredToken('ExponentPushToken[abc]');
    api.mockClear();

    await act(async () => {
      await result.current.logout();
    });

    expect(api).toHaveBeenCalledWith('/devices', {
      method: 'DELETE',
      body: { token: 'ExponentPushToken[abc]' },
    });
    expect(getRegisteredToken()).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('still signs out when unregistering fails', async () => {
    api.mockResolvedValue({ token: 'x', user: user('CUSTOMER') });
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.login('t@demo.rw', 'demo1234');
    });
    setRegisteredToken('ExponentPushToken[abc]');
    api.mockRejectedValue(new Error('offline'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(await tokenStore.get()).toBeNull();
  });

  it('does not make the user wait more than about 3 seconds for a server that never answers', async () => {
    api.mockResolvedValue({ token: 'x', user: user('CUSTOMER') });
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.login('t@demo.rw', 'demo1234');
    });
    setRegisteredToken('ExponentPushToken[abc]');
    api.mockImplementation(() => new Promise(() => {})); // the server is asleep

    const started = Date.now();
    await act(async () => {
      await result.current.logout();
    });
    const waited = Date.now() - started;

    expect(waited).toBeGreaterThanOrEqual(2900); // it does give the server a moment first
    expect(waited).toBeLessThan(5000); // but not the 70 seconds a sleeping server can take
    expect(result.current.user).toBeNull();
    expect(await tokenStore.get()).toBeNull();
    expect(getRegisteredToken()).toBeNull();
  }, 10000);

  it('does not call the devices endpoint when no push token was registered', async () => {
    api.mockResolvedValue({ token: 'x', user: user('CUSTOMER') });
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.login('t@demo.rw', 'demo1234');
    });
    setRegisteredToken(null);
    api.mockClear();

    await act(async () => {
      await result.current.logout();
    });

    expect(api).not.toHaveBeenCalled();
  });

  it('has a home route for the two mobile roles only', () => {
    expect(HOME_BY_ROLE).toEqual({ CUSTOMER: '/customer', TECHNICIAN: '/technician' });
  });
});
