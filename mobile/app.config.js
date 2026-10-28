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
      adaptiveIcon: {
        backgroundColor: '#0B0B0B',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
    },
    plugins: ['expo-router', 'expo-secure-store', 'expo-font'],
  },
};
