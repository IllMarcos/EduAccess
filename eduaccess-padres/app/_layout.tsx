import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_500Medium, Montserrat_300Light } from '@expo-google-fonts/montserrat';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';

// Mantenemos la pantalla de splash nativa visible por defecto
SplashScreen.preventAutoHideAsync();

// Componente de carga para evitar cualquier renderizado de pantallas
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fa' }}>
    <ActivityIndicator size="large" color="#007bff" />
  </View>
);

function RootLayoutNav() {
  const { user, linkStatus, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Si isLoading es true, no hacemos absolutamente nada. La pantalla de carga se encarga.
    if (isLoading) {
      return;
    }

    // En cuanto isLoading es false, tenemos la información definitiva y podemos ocultar el splash.
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (user && linkStatus === 'linked') {
      // CASO 1: Usuario logueado y vinculado -> A la pantalla principal.
      if (inAuthGroup) router.replace('/');
    } else if (user && linkStatus === 'unlinked') {
      // CASO 2: Usuario logueado pero no vinculado -> A vincular.
      router.replace('/(auth)/link-student');
    } else {
      // CASO 3: No hay usuario -> Al login.
      if (!inAuthGroup) router.replace('/(auth)/login');
    }
  }, [isLoading, user, linkStatus]);

  // Si estamos cargando, MOSTRAMOS LA PANTALLA DE CARGA.
  // Esto bloquea físicamente a Expo Router de intentar renderizar una ruta.
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Una vez la carga termina, se renderiza el Stack y el useEffect de arriba
  // se encarga de la redirección instantánea y correcta.
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}