// app/scanner.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const frameSize = width * 0.7;

export default function ScannerScreen() {
  const { mode, schoolId } = useLocalSearchParams<{ mode: 'entry' | 'exit', schoolId: string }>();
  const isFocused = useIsFocused();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [studentName, setStudentName] = useState('');

  const handleBarcodeScanned = async (scanningResult: BarcodeScanningResult) => {
    if (!scanningResult.data) return;
    setScanned(true);
    const qrId = scanningResult.data;

    if (!schoolId) {
      console.error("Error crítico: No se ha proporcionado un schoolId.");
      setScanResult('error');
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    try {
      const studentsRef = collection(db, 'schools', schoolId, 'students');
      const q = query(studentsRef, where('qrId', '==', qrId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setScanResult('error');
      } else {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        
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
          schoolId: schoolId,
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
  
  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Necesitamos tu permiso para usar la cámara</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
  }

  const indicatorColor = mode === 'entry' ? '#e8716d' : '#4a5568';
  const successColor = 'rgba(40, 167, 69, 0.95)';
  const errorColor = 'rgba(225, 73, 67, 0.95)';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {isFocused && (
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer} />
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.focusedContainer}>
            {/* --- CAMBIO: INDICADOR DE MODO INTEGRADO --- */}
            <View style={[styles.modePill, { backgroundColor: indicatorColor }]}>
              <Text style={styles.modePillText}>MODO: {mode?.toUpperCase()}</Text>
            </View>

            <View style={[styles.corner, styles.topLeftCorner]} />
            <View style={[styles.corner, styles.topRightCorner]} />
            <View style={[styles.corner, styles.bottomLeftCorner]} />
            <View style={[styles.corner, styles.bottomRightCorner]} />
            <Text style={styles.guideText}>Coloca el código QR aquí</Text>
          </View>
          <View style={styles.unfocusedContainer} />
        </View>
        <View style={styles.unfocusedContainer} />
      </View>
      
      {/* CAMBIO: El header anterior fue eliminado */}

      <TouchableOpacity onPress={() => router.back()} style={[styles.closeButton, { top: insets.top + 15 }]}>
        <Ionicons name="close-circle" size={36} color="white" style={styles.closeIcon} />
      </TouchableOpacity>

      {scanResult && (
        <View style={[styles.feedbackOverlay, { backgroundColor: scanResult === 'success' ? successColor : errorColor }]}>
          <Text style={styles.feedbackText}>{scanResult === 'success' ? studentName : 'Código QR No Válido'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f7fa',
  },
  permissionText: {
    textAlign: 'center',
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 3,
  },
  closeIcon: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  feedbackText: { 
    color: 'white', 
    fontSize: 32, 
    fontFamily: 'Montserrat_700Bold', 
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleContainer: {
    flexDirection: 'row',
  },
  focusedContainer: {
    width: frameSize,
    height: frameSize,
    position: 'relative',
    alignItems: 'center',
  },
  // --- NUEVO: ESTILO PARA LA PÍLDORA DE MODO ---
  modePill: {
    position: 'absolute',
    top: -50,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePillText: {
    color: 'white', 
    fontSize: 14, 
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
    borderWidth: 6,
    borderRadius: 12,
  },
  topLeftCorner: { top: -2, left: -2, borderBottomWidth: 0, borderRightWidth: 0 },
  topRightCorner: { top: -2, right: -2, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeftCorner: { bottom: -2, left: -2, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRightCorner: { bottom: -2, right: -2, borderTopWidth: 0, borderLeftWidth: 0 },
  guideText: {
    position: 'absolute',
    bottom: -50,
    width: '100%',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
  }
});