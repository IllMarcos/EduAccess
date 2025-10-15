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
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else {
      if (linkStatus === 'unlinked') {
        if (segments.join('/') !== '(auth)/link-student') {
          router.replace('/(auth)/link-student');
        }
      } else if (linkStatus === 'linked') {
        if (inAuthGroup) router.replace('/');
      }
    }
  }, [user, linkStatus, isLoading, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);
  
  if (isLoading) {
    return null;
  }

  return (
    // CAMBIO CLAVE: Se desactiva la animación para evitar el parpadeo
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
      {/* El View con fondo permanente es crucial para evitar franjas de color */}
      <View style={{ flex: 1, backgroundColor: '#f4f7fa' }}>
        <RootLayoutNav />
      </View>
    </AuthProvider>
  );
}