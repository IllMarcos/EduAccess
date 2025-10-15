// app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_500Medium, Montserrat_300Light } from '@expo-google-fonts/montserrat';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync();

// CAMBIO: La firma de la función ahora acepta 'undefined' correctamente
function useStudentLink(user: User | null | undefined) {
  const [linkStatus, setLinkStatus] = useState<'loading' | 'linked' | 'unlinked'>('loading');

  useEffect(() => {
    if (user === undefined) {
      setLinkStatus('loading');
      return;
    }
    if (!user) {
      setLinkStatus('unlinked');
      return;
    }

    const checkLink = async () => {
      setLinkStatus('loading');
      const studentsQuery = query(collectionGroup(db, 'students'), where('tutorUid', '==', user.uid));
      
      try {
        const querySnapshot = await getDocs(studentsQuery);
        setLinkStatus(querySnapshot.empty ? 'unlinked' : 'linked');
      } catch { // CAMBIO: Se elimina la variable 'error' no utilizada
        setLinkStatus('unlinked');
      }
    };

    checkLink();
  }, [user]);

  return linkStatus;
}


export default function RootLayout() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();
  const linkStatus = useStudentLink(user);
  
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
  
  useEffect(() => {
    if (user === undefined || linkStatus === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments.length > 0 && segments[0] !== '(auth)';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/register');
    } else {
      if (linkStatus === 'linked') {
        if (inAuthGroup) router.replace('/');
      } else {
        // CAMBIO: Verificación segura para evitar el error de tupla.
        // Solo redirige si estamos fuera de la pantalla de vinculación.
        const currentRoute = segments.join('/');
        if (currentRoute !== '(auth)/link-student') {
          router.replace('/(auth)/link-student');
        }
      }
    }
  }, [user, linkStatus, segments, router]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && user !== undefined && linkStatus !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, user, linkStatus]);

  if (!fontsLoaded && !fontError || user === undefined || linkStatus === 'loading') {
    return null; 
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f7fa' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' }
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="index" /> 
      </Stack>
    </View>
  );
}