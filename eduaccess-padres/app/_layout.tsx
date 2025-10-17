import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_500Medium, Montserrat_300Light } from '@expo-google-fonts/montserrat';
import { View } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';

// 1. Mantenemos la SplashScreen visible desde el inicio.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, linkStatus, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Si todavía estamos cargando la información, no hacemos absolutamente nada.
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    // 2. Cuando la carga termina, tomamos la decisión de redirección.
    if (!user) {
      // Si no hay usuario, va al login.
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else if (linkStatus === 'unlinked') {
      // Si está logueado pero no vinculado, va a la pantalla de vincular.
      router.replace('/(auth)/link-student');
    } else if (linkStatus === 'linked') {
      // Si está logueado y vinculado, va al home.
      if (inAuthGroup) router.replace('/');
    }
  }, [user, linkStatus, isLoading]); // El efecto depende de estos valores.

  useEffect(() => {
    // 3. SOLO cuando la carga haya terminado, ocultamos la SplashScreen.
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);
  
  // 4. LA CLAVE DEFINITIVA:
  // Si estamos cargando, no devolvemos NADA. No un `null`, no un <View>. Nada.
  // Esto previene que el navegador Stack se renderice prematuramente.
  if (isLoading) {
    return null;
  }

  // 5. Solo cuando la carga ha terminado, renderizamos el navegador.
  // En este punto, el useEffect de redirección ya sabe a dónde ir.
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

  // Esperamos a que las fuentes carguen también antes de hacer nada.
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