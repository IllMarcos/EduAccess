import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
// ===================== CAMBIO DEFINITIVO =====================
// Importamos CameraView, que es el componente JSX correcto en las nuevas versiones.
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera'; 
// =============================================================
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';

const colors = {
    primary: '#e8716d',
    success: '#4caf50',
    error: '#f44336',
    white: '#fff',
    secondary: '#4a5568',
    bgMain: '#f4f7fa',
};

type Feedback = { type: 'success' | 'error'; message: string; } | null;

export default function ScannerScreen() {
    const { mode } = useLocalSearchParams<{ mode: 'entry' | 'exit' }>();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<Feedback>(null);

    const handleBarCodeScanned = async (scanningResult: BarcodeScanningResult) => {
        if (scanned || !scanningResult.data) return;
        setScanned(true);
        const qrId = scanningResult.data;

        try {
            if (!auth.currentUser?.email) throw new Error("Usuario no autenticado");
            const schoolId = auth.currentUser.email.split('@')[1].split('.')[0];
            
            const q = query(collection(db, `schools/${schoolId}/students`), where("qrId", "==", qrId));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setFeedback({ type: 'error', message: 'Código QR No Válido' });
            } else {
                const studentDoc = snapshot.docs[0];
                await addDoc(collection(db, `schools/${schoolId}/history`), {
                    studentId: studentDoc.id, 
                    studentName: studentDoc.data().name,
                    timestamp: serverTimestamp(), 
                    type: mode, 
                    processedBy: auth.currentUser.uid,
                });
                setFeedback({ type: 'success', message: studentDoc.data().name });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: 'Error de Red' });
            console.error(error);
        }
        
        setTimeout(() => {
            setFeedback(null);
            setScanned(false);
        }, 3000);
    };

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.permissionText}>Se necesita acceso a la cámara.</Text>
                <Button title={'Conceder Permiso'} onPress={requestPermission} color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ===================== CAMBIO DEFINITIVO ===================== */}
            {/* Usamos el componente CameraView en lugar de Camera */}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            {/* ============================================================= */}

            <View style={[styles.modeIndicator, { backgroundColor: mode === 'entry' ? colors.success : colors.secondary }]}>
                <Text style={styles.modeText}>MODO: {mode === 'entry' ? 'ENTRADA' : 'SALIDA'}</Text>
            </View>
            {feedback && (
                <View style={[styles.feedbackOverlay, { backgroundColor: feedback.type === 'success' ? colors.success : colors.error }]}>
                    <Text style={styles.feedbackText}>{feedback.message}</Text>
                </View>
            )}
            <View style={styles.scannerGuideContainer}>
                <View style={styles.scannerGuide} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.bgMain },
    permissionText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
    modeIndicator: { position: 'absolute', top: 0, left: 0, right: 0, padding: 15, alignItems: 'center', justifyContent: 'center' },
    modeText: { color: colors.white, fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' },
    feedbackOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    feedbackText: { color: colors.white, fontSize: 32, fontWeight: 'bold', textAlign: 'center', padding: 20 },
    scannerGuideContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scannerGuide: { width: 250, height: 250, borderColor: 'rgba(255, 255, 255, 0.6)', borderWidth: 2, borderRadius: 12, borderStyle: 'dashed' },
});