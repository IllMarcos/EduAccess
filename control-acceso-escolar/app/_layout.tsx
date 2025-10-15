// app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_500Medium, Montserrat_300Light } from '@expo-google-fonts/montserrat';

// Evita que la pantalla de carga se oculte automáticamente
SplashScreen.preventAutoHideAsync();

function useProtectedRoute(user: User | null | undefined) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, segments, router]);
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useProtectedRoute(user);
  
  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (user !== undefined) {
        SplashScreen.hideAsync();
      }
    }
  }, [fontsLoaded, fontError, user]);

  if (!fontsLoaded && !fontError || user === undefined) {
    return null; 
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
      {/* CAMBIO: Se elimina el header de la pantalla del escáner */}
      <Stack.Screen name="scanner" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}