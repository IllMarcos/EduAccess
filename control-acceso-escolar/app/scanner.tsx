// app/scanner.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, Dimensions, StatusBar, TouchableOpacity, Modal } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const frameSize = width * 0.7;

type ConfirmationData = {
  message: string;
  onConfirm: () => Promise<void>;
} | null;

export default function ScannerScreen() {
  const { mode, schoolId } = useLocalSearchParams<{ mode: 'entry' | 'exit', schoolId: string }>();
  const isFocused = useIsFocused();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [studentName, setStudentName] = useState('');
  const [validationMessage, setValidationMessage] = useState('Código QR No Válido');
  const [confirmationData, setConfirmationData] = useState<ConfirmationData>(null);

  const resetScannerState = useCallback(() => {
    setScanned(false);
    setScanResult(null);
    setStudentName('');
    setValidationMessage('Código QR No Válido');
    setConfirmationData(null);
  }, []);

  const showErrorModal = (message: string) => {
    setValidationMessage(message);
    setScanResult('error');
    setTimeout(resetScannerState, 2800); // El modal de error sí se cierra solo
  };

  const saveRecord = useCallback(async (studentId: string, currentStudentName: string) => {
    if (!auth.currentUser || !schoolId) return;

    await addDoc(collection(db, 'history'), {
      studentId,
      studentName: currentStudentName,
      timestamp: serverTimestamp(),
      type: mode,
      scannerUserId: auth.currentUser.uid,
      schoolId: schoolId,
    });
    setStudentName(currentStudentName);
    setScanResult('success');
    setTimeout(resetScannerState, 2800); // El modal de éxito sí se cierra solo
  }, [mode, schoolId, resetScannerState]);

  const handleBarcodeScanned = async (scanningResult: BarcodeScanningResult) => {
    if (!scanningResult.data || scanned) return;
    setScanned(true);

    try {
      const qrId = scanningResult.data;

      if (!schoolId) {
        return showErrorModal('Hubo un problema con la configuración de la app.');
      }
      if (!auth.currentUser) {
        return showErrorModal('Hubo un problema con tu sesión. Por favor, reinicia la app.');
      }
      
      const studentsRef = collection(db, 'schools', schoolId, 'students');
      const studentQuery = query(studentsRef, where('qrId', '==', qrId));
      const studentSnapshot = await getDocs(studentQuery);

      if (studentSnapshot.empty) {
        return showErrorModal('Este código QR no pertenece a ningún alumno.');
      }
      
      const studentDoc = studentSnapshot.docs[0];
      const studentData = studentDoc.data();
      const studentId = studentDoc.id;
      const currentStudentName = studentData.name;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = Timestamp.fromDate(today);

      const historyRef = collection(db, 'history');
      const lastRecordQuery = query(
        historyRef, where('schoolId', '==', schoolId), where('studentId', '==', studentId),
        where('timestamp', '>=', startOfDay), orderBy('timestamp', 'desc'), limit(1)
      );
      
      const lastRecordSnapshot = await getDocs(lastRecordQuery);
      const lastRecord = lastRecordSnapshot.docs[0]?.data();

      if (mode === 'entry' && lastRecord?.type === 'entry') {
        setConfirmationData({
          message: `El alumno ${currentStudentName} ya tiene una entrada registrada hoy. ¿Deseas registrar una nueva entrada?`,
          onConfirm: async () => saveRecord(studentId, currentStudentName),
        });
        return; // Detenemos la ejecución y esperamos la acción del usuario
      }

      if (mode === 'exit' && (!lastRecord || lastRecord.type === 'exit')) {
        setConfirmationData({
          message: `El alumno ${currentStudentName} no tiene una entrada registrada para marcar salida. ¿Deseas registrar la salida de todos modos?`,
          onConfirm: async () => saveRecord(studentId, currentStudentName),
        });
        return; // Detenemos la ejecución y esperamos la acción del usuario
      }

      await saveRecord(studentId, currentStudentName);

    } catch {
      showErrorModal('Ocurrió un error de conexión. Inténtalo de nuevo.');
    }
  };
  
  if (!permission) return <View />;

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {isFocused && (
        <CameraView onBarcodeScanned={handleBarcodeScanned} style={StyleSheet.absoluteFillObject} />
      )}
      
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer} />
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.focusedContainer}>
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
      
      <TouchableOpacity onPress={() => router.back()} style={[styles.closeButton, { top: insets.top + 15 }]}>
        <Ionicons name="close-circle" size={36} color="white" style={styles.closeIcon} />
      </TouchableOpacity>

      {scanResult === 'success' && (
        <View style={[styles.feedbackOverlay, { backgroundColor: successColor }]}>
          <Text style={styles.feedbackText}>{studentName}</Text>
        </View>
      )}

      <Modal animationType="fade" transparent={true} visible={scanResult === 'error'}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={'#e14943'} />
            <Text style={styles.modalTitle}>Acción no permitida</Text>
            <Text style={styles.modalMessage}>{validationMessage}</Text>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={!!confirmationData}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="help-circle-outline" size={60} color={'#e8716d'} />
            <Text style={styles.modalTitle}>Confirmar Acción</Text>
            <Text style={styles.modalMessage}>{confirmationData?.message}</Text>
            <View style={styles.confirmationActions}>
              <TouchableOpacity style={[styles.confirmationButton, styles.cancelButton]} onPress={resetScannerState}>
                <Text style={[styles.confirmationButtonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmationButton, styles.confirmButton]} onPress={async () => {
                // Ejecuta la acción de guardado y LUEGO reinicia el estado
                await confirmationData?.onConfirm();
              }}>
                <Text style={styles.confirmationButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f4f7fa' },
  permissionText: { textAlign: 'center', fontFamily: 'Montserrat_400Regular', fontSize: 16, marginBottom: 20 },
  closeButton: { position: 'absolute', right: 20, zIndex: 3 },
  closeIcon: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 2 },
  feedbackOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 4 },
  feedbackText: { color: 'white', fontSize: 32, fontFamily: 'Montserrat_700Bold', textAlign: 'center', paddingHorizontal: 20 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  middleContainer: { flexDirection: 'row' },
  focusedContainer: { width: frameSize, height: frameSize, position: 'relative', alignItems: 'center' },
  modePill: { position: 'absolute', top: -50, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modePillText: { color: 'white', fontSize: 14, fontFamily: 'Montserrat_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: 'white', borderWidth: 6, borderRadius: 12 },
  topLeftCorner: { top: -2, left: -2, borderBottomWidth: 0, borderRightWidth: 0 },
  topRightCorner: { top: -2, right: -2, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeftCorner: { bottom: -2, left: -2, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRightCorner: { bottom: -2, right: -2, borderTopWidth: 0, borderLeftWidth: 0 },
  guideText: { position: 'absolute', bottom: -50, width: '100%', color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, fontFamily: 'Montserrat_500Medium', textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContainer: { width: '85%', maxWidth: 340, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', color: '#1a202c', marginTop: 15, marginBottom: 10, textAlign: 'center' },
  modalMessage: { fontSize: 16, fontFamily: 'Montserrat_400Regular', color: '#4a5568', textAlign: 'center' },
  confirmationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    width: '100%',
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#4a5568',
  },
  confirmButton: {
    backgroundColor: '#e8716d',
  },
  confirmationButtonText: {
    color: 'white',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
});