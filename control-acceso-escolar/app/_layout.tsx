// app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_500Medium, Montserrat_300Light } from '@expo-google-fonts/montserrat';
import { View } from 'react-native'; // Importamos View

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
    // CAMBIO CLAVE: Envolvemos todo el Stack en un View con el color de fondo deseado.
    // Este View actúa como un "fondo de escenario" permanente.
    <View style={{ flex: 1, backgroundColor: '#f4f7fa' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          // Mantenemos esto como una capa extra de seguridad, pero el View exterior es la solución principal.
          contentStyle: { backgroundColor: 'transparent' } 
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen 
          name="scanner" 
          options={{ 
            presentation: 'modal',
            // Hacemos el fondo del contenedor de la pantalla del escáner transparente
            // para que no haya un parpadeo blanco antes de que la cámara se active.
            contentStyle: { backgroundColor: 'transparent' }
          }} 
        />
      </Stack>
    </View>
  );
}