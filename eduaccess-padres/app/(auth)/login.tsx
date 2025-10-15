import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(() => { 
        // NO HACEMOS NADA AQUÍ.
        // El AuthContext detectará el cambio y el _layout.tsx se encargará de la redirección.
      })
      .catch(() => { 
        setError('Correo o contraseña incorrectos.'); 
      })
      .finally(() => { 
        setLoading(false); 
      });
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.flexGrow} keyboardShouldPersistTaps="handled">
          <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
              <Text style={styles.title}>Bienvenido</Text>
              <Text style={styles.subtitle}>Inicia sesión para continuar.</Text>
              <TextInput style={styles.input} placeholder="Correo Electrónico" placeholderTextColor="#ccc" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#ccc" value={password} onChangeText={setPassword} secureTextEntry />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Pressable style={[styles.buttonAction, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
                <Text style={styles.buttonActionText}>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</Text>
              </Pressable>
              <View style={styles.footer}>
                <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
                <Link href="/(auth)/register" asChild><Pressable><Text style={styles.linkText}>Regístrate</Text></Pressable></Link>
              </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: 'transparent' },
    flex: { flex: 1 },
    flexGrow: { flexGrow: 1 },
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 40 },
    title: { fontSize: 28, fontFamily: 'Montserrat_700Bold', color: '#1a202c', textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 16, fontFamily: 'Montserrat_400Regular', color: '#4a5568', textAlign: 'center', marginBottom: 40 },
    input: { width: '100%', borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 12, paddingHorizontal: 6, fontFamily: 'Montserrat_400Regular', fontSize: 16, color: '#1a202c', marginBottom: 25 },
    errorText: { color: '#e14943', textAlign: 'center', marginBottom: 20, fontFamily: 'Montserrat_400Regular' },
    buttonAction: { backgroundColor: '#e8716d', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    buttonDisabled: { backgroundColor: '#fbd9d7' },
    buttonActionText: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
    footerText: { fontFamily: 'Montserrat_400Regular', color: '#4a5568', fontSize: 14 },
    linkText: { fontFamily: 'Montserrat_700Bold', color: '#e8716d', fontSize: 14 }
});

export default LoginScreen;