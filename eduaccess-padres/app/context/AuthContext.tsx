import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { query, where, getDocs, collectionGroup } from 'firebase/firestore';

type AuthContextType = {
  user: User | null;
  linkStatus: 'loading' | 'linked' | 'unlinked';
  isLoading: boolean;
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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true); // Verificación de Firebase Auth completada

      if (currentUser) {
        setLinkStatus('loading'); // Empezar a verificar el vínculo
        const studentsQuery = query(collectionGroup(db, 'students'), where('tutorUid', '==', currentUser.uid));
        try {
          const querySnapshot = await getDocs(studentsQuery);
          setLinkStatus(querySnapshot.empty ? 'unlinked' : 'linked');
        } catch {
          setLinkStatus('unlinked'); // Asumir no vinculado en caso de error
        }
      } else {
        setLinkStatus('unlinked'); // Si no hay usuario, no hay vínculo
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    linkStatus,
    isLoading: !authChecked || (user != null && linkStatus === 'loading'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};