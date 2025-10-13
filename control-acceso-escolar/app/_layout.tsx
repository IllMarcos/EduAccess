import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Evita que la pantalla de carga se oculte automáticamente
SplashScreen.preventAutoHideAsync();

// FIX: La función ahora acepta 'undefined' como un tipo válido para el usuario.
function useProtectedRoute(user: User | null | undefined) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Si todavía estamos determinando el estado del usuario, no hacemos nada.
    if (user === undefined) {
      return;
    }

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      // Si no hay usuario y no estamos en la pantalla de login, redirigir a login.
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Si hay un usuario y estamos en la pantalla de login, ir a la principal.
      router.replace('/');
    }
  }, [user, segments, router]);
}

export default function RootLayout() {
  // 'undefined' representa el estado de "cargando autenticación"
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // Limpiar la suscripción al desmontar el componente
    return () => unsubscribe();
  }, []);

  useProtectedRoute(user);
  
  // Ocultar la pantalla de carga solo cuando se resuelva la autenticación
  useEffect(() => {
    if (user !== undefined) {
      SplashScreen.hideAsync();
    }
  }, [user]);

  // No renderizar nada hasta que se sepa el estado del usuario para evitar flashes de contenido
  if (user === undefined) {
    return null; 
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="scanner" options={{ title: 'Escaneando...', presentation: 'modal' }} />
    </Stack>
  );
}