// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Ojo con la ruta, subimos un nivel

const HomeScreen = () => {
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth).then(() => {
      // El hook en el layout se encargará de redirigir a /login
      router.replace('/login');
    });
  };

  return (
    <View style={styles.container}>
      {/* Usamos Link para navegar pasando parámetros */}
      <Link href={{ pathname: "/scanner", params: { mode: 'entry' } }} asChild>
        <TouchableOpacity style={[styles.button, styles.entryButton]}>
          <Text style={styles.buttonText}>Registrar ENTRADA</Text>
        </TouchableOpacity>
      </Link>
      
      <Link href={{ pathname: "/scanner", params: { mode: 'exit' } }} asChild>
        <TouchableOpacity style={[styles.button, styles.exitButton]}>
          <Text style={styles.buttonText}>Registrar SALIDA</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

// Estilos (los mismos de antes)
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    button: { width: '80%', padding: 25, borderRadius: 10, marginVertical: 15, alignItems: 'center' },
    entryButton: { backgroundColor: '#28a745' },
    exitButton: { backgroundColor: '#dc3545' },
    buttonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    logoutButton: { position: 'absolute', bottom: 40 },
    logoutText: { color: 'gray', fontSize: 16 }
});

export default HomeScreen;