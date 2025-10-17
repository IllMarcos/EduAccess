import React, { useEffect } from 'react';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_500Medium, Montserrat_300Light } from '@expo-google-fonts/montserrat';
import { View } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as Notifications from 'expo-notifications';

// --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
// Se añaden las propiedades 'priority', 'sound', etc., que son esperadas por el tipo NotificationBehavior.
// La forma más sencilla y compatible es simplemente devolver las opciones por defecto de la notificación.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, linkStatus, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Listener para cuando se recibe una notificación
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida en primer plano:', notification);
    });

    // Listener para cuando el usuario interactúa con la notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interacción con notificación:', response);
    });

    // La forma correcta de limpiar es llamar al método .remove() de cada listener.
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (user && linkStatus === 'linked') {
      if (inAuthGroup) router.replace('/');
    } else if (user && linkStatus === 'unlinked') {
      router.replace('/(auth)/link-student');
    } else if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login');
    }
    
    SplashScreen.hideAsync();

  }, [isLoading, user, linkStatus, router, segments]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_300Light, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: '#f4f7fa' }}>
        <RootLayoutNav />
      </View>
    </AuthProvider>
  );
}