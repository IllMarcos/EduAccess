import { useEffect, useState } from 'react'; // <-- CAMBIO: Añadimos useState aquí
import { useRootNavigationState, router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import * as SplashScreen from 'expo-splash-screen';

// Mantiene el splash screen visible automáticamente al inicio
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const rootNavigationState = useRootNavigationState();
    const [isReady, setIsReady] = useState(false); // <-- useState se usa aquí

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Si el usuario está autenticado, preparamos para ir a la app principal
                router.replace('/(app)/home');
            } else {
                // Si no, preparamos para ir al login
                router.replace('/login');
            }
            // Marcamos que la app ya está lista para ser mostrada
            setIsReady(true);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Ocultamos el splash screen solo cuando la navegación está lista Y
        // ya hemos decidido si el usuario está logueado o no.
        if (isReady && rootNavigationState?.key) {
            SplashScreen.hideAsync();
        }
    }, [isReady, rootNavigationState?.key]);
    
    // Mientras el splash screen está visible, no renderizamos nada.
    return null; 
}