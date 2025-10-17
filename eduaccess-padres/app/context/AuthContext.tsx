import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  linkStatus: 'loading' | 'linked' | 'unlinked';
  isLoading: boolean;
  checkLinkStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [linkStatus, setLinkStatus] = useState<'loading' | 'linked' | 'unlinked'>('loading');
  const [isLoading, setIsLoading] = useState(true); // Siempre empieza en true

  const checkLinkStatus = async () => {
    if (auth.currentUser) {
      try {
        const studentsQuery = query(collectionGroup(db, 'students'), where('tutorUid', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(studentsQuery);
        const isLinked = !querySnapshot.empty;
        setLinkStatus(isLinked ? 'linked' : 'unlinked');
      } catch (error) {
        console.error("Error checking link status:", error);
        setLinkStatus('unlinked');
      }
    }
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // --- LÓGICA ATÓMICA Y DEFINITIVA ---
      if (currentUser) {
        // 1. Primero, obtenemos de forma silenciosa el estado de vinculación.
        const studentsQuery = query(collectionGroup(db, 'students'), where('tutorUid', '==', currentUser.uid));
        const querySnapshot = await getDocs(studentsQuery);
        const isLinked = !querySnapshot.empty;
        
        // 2. AHORA SÍ: Actualizamos todo el estado en un solo paso.
        // La aplicación no sabrá que hay un usuario hasta este preciso momento.
        setUser(currentUser);
        setLinkStatus(isLinked ? 'linked' : 'unlinked');
        setIsLoading(false);

      } else {
        // 3. Si no hay usuario, el estado también es definitivo y se actualiza en un solo paso.
        setUser(null);
        setLinkStatus('unlinked');
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Se ejecuta solo una vez

  const value = { user, linkStatus, isLoading, checkLinkStatus };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};