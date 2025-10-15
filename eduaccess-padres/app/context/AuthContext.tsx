import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { query, where, getDocs, collectionGroup } from 'firebase/firestore';

type AuthContextType = {
  user: User | null;
  linkStatus: 'loading' | 'linked' | 'unlinked';
  isLoading: boolean;
  checkLinkStatus: () => Promise<void>; // <-- NUEVA FUNCIÓN
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

  // CAMBIO: La lógica de verificación ahora está en una función reutilizable
  const checkLinkStatus = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
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
      checkLinkStatus(); // Verificamos el estado al iniciar y al cambiar de usuario
    });

    return () => unsubscribe();
  }, [checkLinkStatus]);

  const value = {
    user,
    linkStatus,
    isLoading: !authChecked || (user != null && linkStatus === 'loading'),
    checkLinkStatus, // Exponemos la función al resto de la app
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};