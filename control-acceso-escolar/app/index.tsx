// app/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { signOut, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SCHOOL_ID } from '../app.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const insets = useSafeAreaInsets();
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

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
    // CAMBIO: Se reemplaza SafeAreaView por un View normal para controlar el fondo.
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* El padding superior e inferior ahora se aplica a este View */}
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
          <TouchableOpacity onPress={() => setLogoutModalVisible(true)}>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isLogoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="exit-outline" size={60} color={'#e8716d'} />
            <Text style={styles.modalTitle}>Confirmar Cierre</Text>
            <Text style={styles.modalMessage}>¿Estás seguro de que quieres cerrar tu sesión?</Text>
            <View style={styles.confirmationActions}>
              <TouchableOpacity style={[styles.confirmationButton, styles.cancelButton]} onPress={() => setLogoutModalVisible(false)}>
                <Text style={[styles.confirmationButtonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmationButton, styles.confirmButton]} onPress={handleLogout}>
                <Text style={styles.confirmationButtonText}>Sí, Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

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
      paddingTop: 20,
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
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      width: '85%',
      maxWidth: 340,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Montserrat_700Bold',
      color: '#1a202c',
      marginTop: 15,
      marginBottom: 10,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 16,
      fontFamily: 'Montserrat_400Regular',
      color: '#4a5568',
      textAlign: 'center',
    },
    confirmationActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 25,
      width: '100%',
    },
    confirmationButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      marginHorizontal: 5,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#f1f5f9',
    },
    cancelButtonText: {
      color: '#4a5568',
    },
    confirmButton: {
      backgroundColor: '#e8716d',
    },
    confirmationButtonText: {
      color: 'white',
      fontFamily: 'Montserrat_700Bold',
      fontSize: 16,
    },
});

export default HomeScreen;