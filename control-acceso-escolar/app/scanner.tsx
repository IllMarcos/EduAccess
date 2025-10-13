import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { db, auth } from '../firebaseConfig'; // Asegúrate que esta ruta es correcta
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ScannerScreen() {
  const { mode } = useLocalSearchParams<{ mode: 'entry' | 'exit' }>();
  const isFocused = useIsFocused();
  
  // FIX: Usar el hook useCameraPermissions para manejar los permisos.
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [studentName, setStudentName] = useState('');

  const handleBarcodeScanned = async (scanningResult: BarcodeScanningResult) => {
    if (!scanningResult.data) return;
    setScanned(true);
    const qrId = scanningResult.data;

    try {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('qrId', '==', qrId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setScanResult('error');
      } else {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        
        // Comprobación segura de que currentUser existe
        if (!auth.currentUser) {
            console.error("Usuario no autenticado.");
            setScanResult('error');
            return;
        }
        const userId = auth.currentUser.uid;

        await addDoc(collection(db, 'history'), {
          studentId: studentDoc.id,
          studentName: studentData.name,
          timestamp: serverTimestamp(),
          type: mode,
          scannerUserId: userId,
        });

        setStudentName(studentData.name);
        setScanResult('success');
      }
    } catch (error) {
      console.error('Error procesando el QR:', error);
      setScanResult('error');
    }

    setTimeout(() => {
      setScanned(false);
      setScanResult(null);
      setStudentName('');
    }, 2000);
  };
  
  // FIX: Lógica de permisos actualizada con el hook.
  if (!permission) {
    // Los permisos todavía se están cargando
    return <View />;
  }

  if (!permission.granted) {
    // Los permisos no han sido concedidos aún
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: 'center' }}>Necesitamos tu permiso para usar la cámara</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View style={[styles.modeIndicator, { backgroundColor: mode === 'entry' ? '#28a745' : '#dc3545' }]}>
        <Text style={styles.modeText}>MODO: {mode?.toUpperCase()}</Text>
      </View>
      {scanResult && (
        <View style={[styles.feedbackOverlay, { backgroundColor: scanResult === 'success' ? 'rgba(40, 167, 69, 0.9)' : 'rgba(220, 53, 69, 0.9)' }]}>
          <Text style={styles.feedbackText}>{scanResult === 'success' ? studentName : 'Código QR No Válido'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 15,
    alignItems: 'center',
    zIndex: 1,
  },
  modeText: { 
    color: 'white', 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackText: { 
    color: 'white', 
    fontSize: 32, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
});