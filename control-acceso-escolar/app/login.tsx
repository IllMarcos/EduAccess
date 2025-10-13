// app/login.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Ajusta la ruta si es necesario
import { useRouter } from 'expo-router';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        // En lugar de navigation.replace, usamos router.replace.
        // El hook en _layout se encargará de la redirección, pero
        // esto asegura una transición inmediata.
        router.replace('/'); 
      })
      .catch(() => {
        setError('Usuario o contraseña incorrectos.');
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Control de Acceso</Text>
      <TextInput
        style={styles.input}
        placeholder="Usuario (email)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button title="Iniciar Sesión" onPress={handleLogin} />
    </View>
  );
};

// Estilos (los mismos de antes)
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, paddingHorizontal: 8 },
    errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
});

export default LoginScreen;