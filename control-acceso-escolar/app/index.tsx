// app/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { signOut, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { SCHOOL_ID } from '../app.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // Obtenemos los márgenes seguros para la parte superior e inferior
  const insets = useSafeAreaInsets();

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('es-MX', dateOptions);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.replace('/login');
    });
  };

  return (
    // CAMBIO: SafeAreaView ya no es necesario aquí, lo controlaremos manualmente
    <View style={styles.wrapper}>
      {/* CAMBIO: Hacemos la barra de estado translúcida */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* CAMBIO: El contenedor principal ahora tiene padding dinámico arriba y abajo */}
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>EduAccess</Text>
          {user && <Text style={styles.welcomeText}>Bienvenido, {user.email}</Text>}
          <Text style={styles.dateText}>{today}</Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <Link href={{ pathname: "/scanner", params: { mode: 'entry', schoolId: SCHOOL_ID } }} asChild>
            <TouchableOpacity style={styles.buttonWrapper}>
              <View style={[styles.button, styles.entryButton]}>
                <MaterialIcons name="login" size={60} color="white" />
                <Text style={styles.buttonText}>Registrar Entrada</Text>
              </View>
            </TouchableOpacity>
          </Link>
          
          <Link href={{ pathname: "/scanner", params: { mode: 'exit', schoolId: SCHOOL_ID } }} asChild>
            <TouchableOpacity style={styles.buttonWrapper}>
              <View style={[styles.button, styles.exitButton]}>
                <MaterialIcons name="logout" size={60} color="white" />
                <Text style={styles.buttonText}>Registrar Salida</Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- ESTILOS REFINADOS PARA EDGE-TO-EDGE ---
const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: '#f4f7fa',
    },
    container: { 
      flex: 1, 
      alignItems: 'center',
    },
    header: {
      width: '100%',
      alignItems: 'center',
      paddingTop: 20, // Padding estático reducido, el dinámico hace el trabajo
    },
    title: {
      fontSize: 36,
      fontFamily: 'Montserrat_700Bold',
      color: '#1a202c', 
    },
    welcomeText: {
      fontSize: 16,
      fontFamily: 'Montserrat_400Regular',
      color: '#4a5568',
      marginTop: 10,
    },
    dateText: {
      fontSize: 14,
      fontFamily: 'Montserrat_400Regular',
      color: '#a0aec0',
      marginTop: 4,
      textTransform: 'capitalize',
    },
    actionsContainer: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    buttonWrapper: {
      width: '100%',
      marginVertical: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 15,
    },
    button: {
      width: '100%',
      aspectRatio: 1.5, 
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    entryButton: { 
      backgroundColor: '#e8716d',
    },
    exitButton: { 
      backgroundColor: '#4a5568',
    },
    buttonText: { 
      color: 'white', 
      fontSize: 20, 
      fontFamily: 'Montserrat_500Medium',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginTop: 20,
      textAlign: 'center',
      paddingHorizontal: 10,
    },
    footer: {
      paddingVertical: 10,
    },
    logoutText: { 
      color: '#a0aec0', 
      fontSize: 16,
      fontFamily: 'Montserrat_400Regular',
      padding: 10,
    }
});

export default HomeScreen;