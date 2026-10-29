import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerForPush, routeForNotification } from './push.js';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'project-1' } } } },
}));

describe('routeForNotification', () => {
  it('opens the fault for a customer and the job for a technician', () => {
    expect(routeForNotification('CUSTOMER', { faultId: 12 })).toBe('/customer/faults/12');
    expect(routeForNotification('TECHNICIAN', { faultId: 12 })).toBe('/technician/jobs/12');
  });

  it('accepts a faultId that arrived as a string', () => {
    expect(routeForNotification('CUSTOMER', { faultId: '7' })).toBe('/customer/faults/7');
  });

  it('opens the Alerts tab when there is no usable faultId', () => {
    expect(routeForNotification('CUSTOMER', {})).toBe('/customer/notifications');
    expect(routeForNotification('TECHNICIAN', { faultId: null })).toBe('/technician/notifications');
    expect(routeForNotification('TECHNICIAN', undefined)).toBe('/technician/notifications');
    expect(routeForNotification('CUSTOMER', { faultId: 'abc' })).toBe('/customer/notifications');
  });

  it('has no route for a role that does not use the app', () => {
    expect(routeForNotification('COORDINATOR', { faultId: 1 })).toBeNull();
  });
});

describe('registerForPush', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Device.isDevice = true;
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns the Expo push token when permission is already granted', async () => {
    expect(await registerForPush()).toBe('ExponentPushToken[abc]');
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-1' });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('asks for permission when it is not granted yet, then returns the token', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    expect(await registerForPush()).toBe('ExponentPushToken[abc]');
  });

  it('returns null when permission is denied', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    expect(await registerForPush()).toBeNull();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('returns null when the token request throws', async () => {
    Notifications.getExpoPushTokenAsync.mockRejectedValue(new Error('FCM not configured'));
    expect(await registerForPush()).toBeNull();
  });

  it('returns null on an emulator', async () => {
    Device.isDevice = false;
    expect(await registerForPush()).toBeNull();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});
