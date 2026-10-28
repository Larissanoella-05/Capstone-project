import { Archivo_400Regular, Archivo_600SemiBold, Archivo_700Bold, Archivo_900Black, useFonts } from '@expo-google-fonts/archivo';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext.js';
import { ToastProvider } from '../src/context/ToastContext.js';

SplashScreen.preventAutoHideAsync().catch(() => {});

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
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#ffffff' } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={user?.role === 'CUSTOMER'}>
        <Stack.Screen name="customer" />
      </Stack.Protected>
      <Stack.Protected guard={user?.role === 'TECHNICIAN'}>
        <Stack.Screen name="technician" />
      </Stack.Protected>
    </Stack>
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
