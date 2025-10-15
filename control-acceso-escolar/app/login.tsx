// app/login.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useRouter } from 'expo-router';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (!email || !password) {
      setError('Por favor, completa ambos campos.');
      return;
    }
    setError('');
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        router.replace('/'); 
      })
      .catch(() => {
        setError('Usuario o contraseña incorrectos.');
      });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.wrapper}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.buttonAction} onPress={handleLogin}>
          <Text style={styles.buttonActionText}>Ingresar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

// CAMBIO: Estilos completamente nuevos basados en login.css
const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: '#f4f7fa',
    },
    container: { 
      flex: 1, 
      justifyContent: 'center', 
      padding: 40,
    },
    title: { 
      fontSize: 24, 
      fontFamily: 'Montserrat_500Medium',
      lineHeight: 24,
      textTransform: 'uppercase',
      color: '#e8716d',
      letterSpacing: 1.5,
      textAlign: 'center',
      marginBottom: 45,
    },
    input: { 
      width: '100%',
      borderBottomWidth: 1,
      borderColor: '#ccc',
      paddingVertical: 10,
      paddingHorizontal: 6,
      fontFamily: 'Montserrat_300Light',
      fontSize: 16,
      color: '#8f8f8f',
      letterSpacing: 1,
      marginBottom: 20,
    },
    errorText: { 
      color: '#e14943', 
      textAlign: 'center', 
      marginBottom: 20,
      fontFamily: 'Montserrat_400Regular',
    },
    buttonAction: {
      backgroundColor: '#e8716d',
      borderRadius: 3,
      paddingVertical: 12,
      paddingHorizontal: 35,
      alignSelf: 'center',
      marginTop: 20,
    },
    buttonActionText: {
      fontSize: 16,
      fontFamily: 'Montserrat_300Light',
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: 1,
    }
});

export default LoginScreen;