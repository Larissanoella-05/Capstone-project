const fs = require('fs');
const path = require('path');

// Firebase config for push (Android FCM). EAS supplies it as the file variable GOOGLE_SERVICES_JSON; locally it is
// ./google-services.json (git-ignored). With neither, the app still builds and bundles (CI) but cannot get push tokens.
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ||
  (fs.existsSync(path.join(__dirname, 'google-services.json')) ? './google-services.json' : undefined);

// Expo reads this file instead of app.json. Native settings are added by config plugins, not by hand.
module.exports = {
  expo: {
    name: 'Umuriro',
    slug: 'umuriro-response',
    scheme: 'umuriro',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    android: {
      package: 'rw.umuriro.response',
      ...(googleServicesFile ? { googleServicesFile } : {}),
      // The app needs only INTERNET, fine and coarse location, CAMERA and POST_NOTIFICATIONS (added by the plugins
      // above). Libraries also ask for the rest of these, so they are removed from the merged manifest.
      blockedPermissions: [
        'android.permission.READ_EXTERNAL_STORAGE', // photos come from the system picker, which needs no storage access
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECEIVE_BOOT_COMPLETED', // only for scheduled notifications, which this app does not use
        'android.permission.SYSTEM_ALERT_WINDOW', // development tools overlay; not for the installed app
        'android.permission.RECORD_AUDIO',
      ],
      adaptiveIcon: {
        backgroundColor: '#0B0B0B',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      '@maplibre/maplibre-react-native',
      [
        'expo-splash-screen',
        {
          // The bolt on the app's near-black, like the web brand. The image is drawn 160 dp wide.
          backgroundColor: '#0B0B0B',
          image: './assets/splash-icon.png',
          imageWidth: 160,
        },
      ],
      [
        'expo-location',
        {
          // Foreground only: no background-location permission and no foreground service, so no Play review for it.
          locationWhenInUsePermission: 'Umuriro shares your position with the customer while you are on a job.',
          locationAlwaysPermission: false,
          isAndroidBackgroundLocationEnabled: false,
          isAndroidForegroundServiceEnabled: false,
        },
      ],
      [
        'expo-notifications',
        {
          // Small white-on-transparent status-bar icon, yellow tint, and the channel the backend names in each push.
          icon: './assets/notification-icon.png',
          color: '#FFD400',
          defaultChannel: 'default',
        },
      ],
      [
        'expo-image-picker',
        {
          cameraPermission: 'Umuriro uses the camera so you can attach a photo of the fault to your report.',
          photosPermission: 'Umuriro reads a photo you choose so you can attach it to your report.',
          microphonePermission: false,
        },
      ],
    ],
    // Written by hand: `eas init` cannot edit a dynamic config. Read later for the push token.
    extra: { eas: { projectId: '1694e3af-e12a-4881-befa-d03b3eef34be' } },
  },
};
