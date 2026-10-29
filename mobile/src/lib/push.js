import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export { routeForNotification } from './routes.js';

/**
 * Creates the Android channel, asks permission and returns this phone's Expo push token,
 * or null if pushes are not possible (no permission, an emulator, no EAS project, or Expo refused).
 */
export async function registerForPush() {
  try {
    if (Platform.OS === 'android') {
      // The channel must exist before Android 13 will show the permission dialog.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Fault updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD400',
      });
    }
    if (!Device.isDevice) return null;

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[push] no EAS project id in the app config, so no push token');
      return null;
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    console.warn('[push] could not get a push token:', error.message);
    return null;
  }
}
