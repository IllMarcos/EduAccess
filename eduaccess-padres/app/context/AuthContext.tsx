import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { query, where, getDocs, collectionGroup, doc, setDoc } from 'firebase/firestore';
// --- NUEVO: Imports para notificaciones ---
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

type AuthContextType = {
  user: User | null;
  linkStatus: 'loading' | 'linked' | 'unlinked';
  isLoading: boolean;
  checkLinkStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [linkStatus, setLinkStatus] = useState<'loading' | 'linked' | 'unlinked'>('loading');
  const [authChecked, setAuthChecked] = useState(true);

  // --- NUEVO: Función para guardar el token FCM ---
  const saveFcmToken = async (userId: string) => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permiso de notificaciones denegado.');
      return;
    }
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (token) {
        const tutorDocRef = doc(db, 'tutores', userId);
        // Usamos setDoc con merge:true para crear o actualizar el documento sin borrar otros campos
        await setDoc(tutorDocRef, { fcmToken: token }, { merge: true });
        console.log('FCM Token guardado con éxito.');
      }
    } catch (error) {
      console.error("Error al obtener o guardar el token FCM:", error);
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  };

  const checkLinkStatus = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // --- NUEVO: Se llama a la función para guardar el token ---
      await saveFcmToken(currentUser.uid);

      setLinkStatus('loading');
      const studentsQuery = query(collectionGroup(db, 'students'), where('tutorUid', '==', currentUser.uid));
      try {
        const querySnapshot = await getDocs(studentsQuery);
        setLinkStatus(querySnapshot.empty ? 'unlinked' : 'linked');
      } catch {
        setLinkStatus('unlinked');
      }
    } else {
      setLinkStatus('unlinked');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
      checkLinkStatus(); 
    });

    return () => unsubscribe();
  }, [checkLinkStatus]);

  const value = {
    user,
    linkStatus,
    isLoading: !authChecked || (user != null && linkStatus === 'loading'),
    checkLinkStatus,
  };

  // --- (AQUÍ ESTÁ LA CORRECCIÓN) ---
  // El tag de cierre debe ser </AuthContext.Provider>
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};