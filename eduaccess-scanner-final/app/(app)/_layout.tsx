import React from 'react';
import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

export default function AppLayout() {
    const handleLogout = () => {
        signOut(auth);
    };

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#e8716d' },
                headerTintColor: '#fff',
            }}
        >
            <Stack.Screen
                name="home"
                options={{
                    title: 'Seleccionar Modo',
                    headerLeft: () => null,
                    headerRight: () => (
                        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Salir</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen name="scanner" options={{ title: 'Escaneando...' }} />
        </Stack>
    );
}