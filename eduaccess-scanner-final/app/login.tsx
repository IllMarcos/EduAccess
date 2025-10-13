import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

// Paleta de colores consistente
const colors = {
    primary: '#e8716d',
    primaryHover: '#e14943',
    textHeader: '#1a202c',
    textBody: '#4a5568',
    bgMain: '#f4f7fa',
    borderColor: '#e2e8f0',
};

const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorMessage('Por favor, ingresa correo y contraseña.');
            return;
        }
        setLoading(true);
        setErrorMessage('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) { // <-- La variable 'error'
            console.error("Error de login:", error); // <-- Añade esta línea para usar la variable
            setErrorMessage('Correo o contraseña incorrectos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <Text style={styles.title}>EduAccess</Text>
            <Text style={styles.subtitle}>Acceso de Personal</Text>
            
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Correo Electrónico"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Ingresar</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bgMain,
        padding: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: colors.primary,
        fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: colors.textBody,
        marginBottom: 40,
    },
    form: {
        width: '100%',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.borderColor,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: colors.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    errorText: {
        color: colors.primaryHover,
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '500',
    },
});

export default LoginScreen;