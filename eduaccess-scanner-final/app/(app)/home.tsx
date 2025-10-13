import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Link } from 'expo-router';

// Paleta de colores
const colors = {
    primary: '#e8716d',
    secondary: '#4a5568',
    textHeader: '#1a202c',
    textBody: '#fff',
    bgMain: '#f4f7fa',
};

const HomeScreen: React.FC = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Seleccionar Acción</Text>
                <Text style={styles.subtitle}>Elige el tipo de registro que vas a realizar.</Text>
            </View>
            <View style={styles.buttonContainer}>
                <Link href={{ pathname: "/(app)/scanner", params: { mode: 'entry' } }} asChild>
                    <TouchableOpacity style={[styles.button, styles.entryButton]}>
                        <Text style={styles.buttonText}>Registrar ENTRADA</Text>
                    </TouchableOpacity>
                </Link>

                <Link href={{ pathname: "/(app)/scanner", params: { mode: 'exit' } }} asChild>
                    <TouchableOpacity style={[styles.button, styles.exitButton]}>
                        <Text style={styles.buttonText}>Registrar SALIDA</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgMain,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textHeader,
        fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
    },
    subtitle: {
        fontSize: 18,
        color: colors.secondary,
        marginTop: 10,
        textAlign: 'center',
    },
    buttonContainer: {
        paddingHorizontal: 20,
    },
    button: {
        width: '100%',
        paddingVertical: 25,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    entryButton: {
        backgroundColor: colors.primary,
    },
    exitButton: {
        backgroundColor: colors.secondary,
    },
    buttonText: {
        color: colors.textBody,
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
});

export default HomeScreen;