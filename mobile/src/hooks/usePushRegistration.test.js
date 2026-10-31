import * as Notifications from 'expo-notifications';
import { act, renderHook } from '@testing-library/react-native';
import { api } from '../lib/api.js';
import { getRegisteredToken, setRegisteredToken } from '../lib/deviceToken.js';
import { registerForPush } from '../lib/push.js';
import { usePushRegistration } from './usePushRegistration.js';

jest.mock('expo-notifications', () => ({ addPushTokenListener: jest.fn() }));
jest.mock('../lib/api.js', () => ({ api: jest.fn() }));
jest.mock('../lib/push.js', () => ({ registerForPush: jest.fn() }));

let onTokenChange;
let removeListener;

beforeEach(() => {
  jest.clearAllMocks();
  setRegisteredToken(null);
  removeListener = jest.fn();
  Notifications.addPushTokenListener.mockImplementation((listener) => {
    onTokenChange = listener;
    return { remove: removeListener };
  });
  registerForPush.mockResolvedValue('ExponentPushToken[first]');
  api.mockResolvedValue({ registered: true });
});

const settle = () => act(async () => {});
const aline = { id: 1, role: 'CUSTOMER' };

describe('usePushRegistration', () => {
  it('does nothing while signed out', async () => {
    await renderHook(() => usePushRegistration(null));
    await settle();
    expect(registerForPush).not.toHaveBeenCalled();
    expect(api).not.toHaveBeenCalled();
  });

  it('registers this phone once after sign-in', async () => {
    const { rerender } = await renderHook(({ user }) => usePushRegistration(user), {
      initialProps: { user: aline },
    });
    await settle();

    expect(api).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledWith('/devices', {
      method: 'POST',
      body: { token: 'ExponentPushToken[first]', platform: 'android' },
    });
    expect(getRegisteredToken()).toBe('ExponentPushToken[first]');

    // A re-render for the same user (a new object, same id) must not register again.
    await rerender({ user: { ...aline } });
    await settle();
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('registers again when Expo changes the token', async () => {
    await renderHook(() => usePushRegistration(aline));
    await settle();

    await act(async () => onTokenChange({ data: 'ExponentPushToken[second]' }));

    expect(api).toHaveBeenLastCalledWith('/devices', {
      method: 'POST',
      body: { token: 'ExponentPushToken[second]', platform: 'android' },
    });
    expect(getRegisteredToken()).toBe('ExponentPushToken[second]');
  });

  it('registers for the new user when someone else signs in on the same phone', async () => {
    const { rerender } = await renderHook(({ user }) => usePushRegistration(user), {
      initialProps: { user: aline },
    });
    await settle();
    await rerender({ user: { id: 2, role: 'TECHNICIAN' } });
    await settle();
    expect(api).toHaveBeenCalledTimes(2);
  });

  it('sends nothing when no token could be obtained', async () => {
    registerForPush.mockResolvedValue(null);
    await renderHook(() => usePushRegistration(aline));
    await settle();
    expect(api).not.toHaveBeenCalled();
  });

  it('keeps going when the server refuses the registration', async () => {
    api.mockRejectedValue(new Error('offline'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await renderHook(() => usePushRegistration(aline));
    await settle();
    expect(getRegisteredToken()).toBeNull();
  });

  it('stops listening for token changes on sign-out', async () => {
    const { rerender } = await renderHook(({ user }) => usePushRegistration(user), {
      initialProps: { user: aline },
    });
    await settle();
    await rerender({ user: null });
    expect(removeListener).toHaveBeenCalled();
  });
});
