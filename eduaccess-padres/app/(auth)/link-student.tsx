// app/(auth)/link-student.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

const LinkStudentScreen = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLinkStudent = async () => {
    if (code.trim().length === 0) {
      setError('Por favor, ingresa el código de invitación.');
      return;
    }
    setError('');
    setLoading(true);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('No se ha podido verificar tu sesión. Por favor, reinicia la app.');
      setLoading(false);
      return;
    }

    try {
      const schoolsCollectionRef = collection(db, 'schools');
      const schoolsSnapshot = await getDocs(schoolsCollectionRef);
      let studentFound = false;
      const batch = writeBatch(db);

      for (const schoolDoc of schoolsSnapshot.docs) {
        const studentsCollectionRef = collection(db, 'schools', schoolDoc.id, 'students');
        const q = query(studentsCollectionRef, where('invitationCode', '==', code.trim().toUpperCase()));
        const studentSnapshot = await getDocs(q);

        if (!studentSnapshot.empty) {
          const studentDoc = studentSnapshot.docs[0];
          const studentData = studentDoc.data();

          if (studentData.tutorUid) {
            setError('Este código de invitación ya ha sido utilizado.');
            setLoading(false);
            return;
          }

          batch.update(studentDoc.ref, {
            tutorUid: currentUser.uid,
            invitationCode: null,
          });
          
          studentFound = true;
          break;
        }
      }

      if (studentFound) {
        await batch.commit();
        Alert.alert('¡Vinculación Exitosa!', 'Tu cuenta ha sido conectada con el perfil de tu hijo.');
        router.replace('/');
      } else {
        setError('El código de invitación no es válido o ya fue utilizado.');
      }

    } catch (err) {
      setError('Ocurrió un error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.innerContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>Vincular Alumno</Text>
              <Text style={styles.subtitle}>Ingresa el código de invitación que te proporcionó la escuela.</Text>
              
              <TextInput
                style={styles.input}
                placeholder="CÓDIGO"
                placeholderTextColor="#ccc"
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable style={[styles.buttonAction, loading && styles.buttonDisabled]} onPress={handleLinkStudent} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonActionText}>Vincular</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// --- ESTILOS REESTRUCTURADOS Y CORREGIDOS ---
const styles = StyleSheet.create({
    wrapper: { 
      flex: 1, 
      backgroundColor: '#f4f7fa',
    },
    keyboardAvoidingContainer: {
      flex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
    },
    innerContainer: { 
      flex: 1, // Clave: Asegura que el contenedor ocupe todo el espacio vertical
      justifyContent: 'center', 
      paddingHorizontal: 40,
    },
    formContainer: {
      // Contenedor del formulario, no necesita flex: 1
    },
    title: { 
      fontSize: 28, 
      fontFamily: 'Montserrat_700Bold',
      color: '#1a202c',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Montserrat_400Regular',
      color: '#4a5568',
      textAlign: 'center',
      marginBottom: 40,
    },
    input: { 
      width: '100%',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: 'white',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 8,
      fontFamily: 'Montserrat_500Medium',
      fontSize: 22,
      textAlign: 'center',
      letterSpacing: 5,
      color: '#1a202c',
      marginBottom: 25,
    },
    errorText: { 
      color: '#e14943', 
      textAlign: 'center', 
      marginBottom: 20,
      fontFamily: 'Montserrat_400Regular',
    },
    buttonAction: {
      backgroundColor: '#e8716d',
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    buttonDisabled: {
      backgroundColor: '#fbd9d7',
    },
    buttonActionText: {
      fontSize: 16,
      fontFamily: 'Montserrat_500Medium',
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
});

export default LinkStudentScreen;