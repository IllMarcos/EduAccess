import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { query, where, getDocs, collectionGroup, setDoc, DocumentReference } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

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
  const [isLoading, setIsLoading] = useState(true); // 1. La carga siempre inicia en 'true'.

  const saveFcmToken = async (studentDocRef: DocumentReference) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (token) {
        // Usamos la referencia directa para evitar una segunda consulta.
        await setDoc(studentDocRef, { fcmToken: token }, { merge: true });
      }
    } catch (error) {
      console.error("Error al guardar el token FCM:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // --- PROCESO SECUENCIAL OBLIGATORIO ---
        // 2. Si hay un usuario, consultamos la base de datos.
        const studentsQuery = query(collectionGroup(db, 'students'), where('tutorUid', '==', currentUser.uid));
        const querySnapshot = await getDocs(studentsQuery);
        
        const isLinked = !querySnapshot.empty;
        setLinkStatus(isLinked ? 'linked' : 'unlinked');

        // Si está vinculado, intentamos guardar el token en segundo plano.
        if (isLinked) {
          const studentDocRef = querySnapshot.docs[0].ref;
          saveFcmToken(studentDocRef); // No usamos await para no bloquear la UI.
        }

      } else {
        // Si no hay usuario, el estado es definitivo.
        setLinkStatus('unlinked');
      }

      // 3. CRÍTICO Y FINAL: Solo cuando todo el proceso anterior ha terminado,
      // la carga finaliza.
      setIsLoading(false);
    });

    return () => unsubscribe(); // Limpiamos el listener.
  }, []); // El array vacío asegura que esto se ejecute una sola vez.

  // Función para refrescar el estado desde link-student.tsx
  const checkLinkStatus = async () => {
    setIsLoading(true);
    const currentUser = auth.currentUser;
    if(currentUser) {
        const studentsQuery = query(collectionGroup(db, 'students'), where('tutorUid', '==', currentUser.uid));
        const querySnapshot = await getDocs(studentsQuery);
        setLinkStatus(querySnapshot.empty ? 'unlinked' : 'linked');
    } else {
        setLinkStatus('unlinked');
    }
    setIsLoading(false);
  }

  const value = { user, linkStatus, isLoading, checkLinkStatus };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};