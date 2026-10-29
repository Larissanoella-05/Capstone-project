import { Archivo_400Regular, Archivo_600SemiBold, Archivo_700Bold, Archivo_900Black, useFonts } from '@expo-google-fonts/archivo';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext.js';
import { ToastProvider } from '../src/context/ToastContext.js';

import { usePushRegistration } from '../src/hooks/usePushRegistration.js';
import { routeForNotification } from '../src/lib/routes.js';

SplashScreen.preventAutoHideAsync().catch(() => {});

// A push that arrives while the app is open still shows as a banner, with sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** Registers this phone for pushes after sign-in and opens the right screen when a notification is tapped. */
function PushBridge() {
  const { user } = useAuth();
  const router = useRouter();
  usePushRegistration(user);

  // Covers a tap while the app runs and a cold start from a tap on a notification.
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response) return;
    if (!user) {
      // Signed out: nowhere sensible to go, and the tap must not fire after the next sign-in.
      Notifications.clearLastNotificationResponse();
      return;
    }
    if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      const route = routeForNotification(user.role, response.notification.request.content.data);
      if (route) router.push(route);
    }
    Notifications.clearLastNotificationResponse();
  }, [response, user, router]);

  return null;
}

function RootStack() {
  const { user, loading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    Archivo_400Regular,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_900Black,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  const ready = (fontsLoaded || fontError) && !loading;

  // Keep the splash screen up until the saved session and the fonts are both ready.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#ffffff' } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!user}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={user?.role === 'CUSTOMER'}>
          <Stack.Screen name="customer" />
        </Stack.Protected>
        <Stack.Protected guard={user?.role === 'TECHNICIAN'}>
          <Stack.Screen name="technician" />
        </Stack.Protected>
      </Stack>
      {/* After the Stack, so its effects run once the navigator exists and a cold-start tap can navigate. */}
      <PushBridge />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <RootStack />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
