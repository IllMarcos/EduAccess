import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LinkStudentScreen = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { checkLinkStatus } = useAuth();

  const handleLinkStudent = async () => {
    if (code.trim().length === 0) {
      setError('Por favor, ingresa el código de invitación.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user");

      // --- SOLUCIÓN AL BUG DE LÓGICA ---
      // Se cambia el método de búsqueda a uno más robusto que no necesita índices especiales.
      // 1. Obtenemos todas las escuelas.
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      let studentFound = false;
      const batch = writeBatch(db);

      // 2. Buscamos en la sub-colección de alumnos de CADA escuela.
      for (const schoolDoc of schoolsSnapshot.docs) {
        const studentsRef = collection(db, 'schools', schoolDoc.id, 'students');
        const q = query(studentsRef, where('invitationCode', '==', code.trim().toUpperCase()));
        const studentSnapshot = await getDocs(q);

        if (!studentSnapshot.empty) {
          const studentDoc = studentSnapshot.docs[0];
          if (studentDoc.data().tutorUid) {
            setError('Este código de invitación ya ha sido utilizado.');
            setLoading(false);
            return;
          }
          
          batch.update(studentDoc.ref, {
            tutorUid: currentUser.uid,
            invitationCode: null,
          });

          studentFound = true;
          break; // Detenemos la búsqueda en cuanto encontramos al alumno.
        }
      }

      if (studentFound) {
        await batch.commit();
        setShowSuccessModal(true); // Mostramos el modal de éxito.
      } else {
        setError('El código de invitación no es válido o ya fue utilizado.');
      }

    } catch {
      setError('Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const onModalContinue = async () => {
    setShowSuccessModal(false);
    await checkLinkStatus(); // Le decimos al "cerebro" que re-verifique el estado.
    // El _layout se encargará de la redirección.
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.flexGrow}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Text style={styles.title}>Vincular Alumno</Text>
            <Text style={styles.subtitle}>Ingresa el código de invitación que te proporcionó la escuela.</Text>
            <TextInput style={styles.input} placeholder="CÓDIGO" placeholderTextColor="#ccc" value={code} onChangeText={(text) => setCode(text.toUpperCase())} autoCapitalize="characters" maxLength={6} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable style={[styles.buttonAction, loading && styles.buttonDisabled]} onPress={handleLinkStudent} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonActionText}>Vincular</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent={true} visible={showSuccessModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color={'#28a745'} />
            <Text style={styles.modalTitle}>¡Vinculación Exitosa!</Text>
            <Text style={styles.modalMessage}>Tu cuenta ha sido conectada con el perfil de tu hijo.</Text>
            <Pressable style={[styles.buttonAction, { width: '100%' }]} onPress={onModalContinue}>
              <Text style={styles.buttonActionText}>Continuar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    input: { width: '100%', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: 'white', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 8, fontFamily: 'Montserrat_500Medium', fontSize: 22, textAlign: 'center', letterSpacing: 5, color: '#1a202c', marginBottom: 25 },
    errorText: { color: '#e14943', textAlign: 'center', marginBottom: 20, fontFamily: 'Montserrat_400Regular' },
    buttonAction: { backgroundColor: '#e8716d', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    buttonDisabled: { backgroundColor: '#fbd9d7' },
    buttonActionText: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContainer: { width: '85%', maxWidth: 340, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', color: '#1a202c', marginTop: 15, marginBottom: 10, textAlign: 'center' },
    modalMessage: { fontSize: 16, fontFamily: 'Montserrat_400Regular', color: '#4a5568', textAlign: 'center' },
});

export default LinkStudentScreen;