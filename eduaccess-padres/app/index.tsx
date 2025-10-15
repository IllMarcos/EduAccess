// app/index.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const DashboardScreen = () => {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.replace('/(auth)/login');
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido!</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Pressable onPress={handleLogout} style={styles.button}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fa'
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: '#4a5568',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#e8716d',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
  }
})

export default DashboardScreen