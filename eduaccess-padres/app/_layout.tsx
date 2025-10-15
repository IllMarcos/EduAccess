import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_500Medium, Montserrat_300Light } from '@expo-google-fonts/montserrat';
import { View } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, linkStatus, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // La clave: No hacer NADA hasta que el contexto confirme que ha terminado de cargar.
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      // Si no hay usuario, debe estar en el flujo de auth.
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else {
      // Si hay usuario...
      if (linkStatus === 'unlinked') {
        // ...pero no está vinculado, debe ir a la pantalla de vinculación.
        if (segments.join('/') !== '(auth)/link-student') {
          router.replace('/(auth)/link-student');
        }
      } else if (linkStatus === 'linked') {
        // ...y está vinculado, debe ir al dashboard (fuera de auth).
        if (inAuthGroup) router.replace('/');
      }
    }
  }, [user, linkStatus, isLoading, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);
  
  // No renderizar nada hasta que isLoading sea false. Esto previene el parpadeo.
  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
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