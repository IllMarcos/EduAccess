import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, collectionGroup, orderBy, Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';

type Student = {
  id: string;
  name: string;
};

type HistoryRecord = {
  id: string;
  type: 'entry' | 'exit';
  studentName: string;
  timestamp: Timestamp;
};

const DashboardScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); // Usamos el contexto para obtener el usuario

  const [student, setStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Buscar al alumno vinculado al padre/tutor
        const studentsQuery = query(collectionGroup(db, 'students'), where('tutorUid', '==', user.uid));
        const studentSnapshot = await getDocs(studentsQuery);

        if (!studentSnapshot.empty) {
          const studentDoc = studentSnapshot.docs[0];
          const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
          setStudent(studentData);

          // 2. Con el ID del alumno, buscar su historial de asistencia
          const historyQuery = query(
            collection(db, 'history'),
            where('studentId', '==', studentDoc.id),
            orderBy('timestamp', 'desc')
          );
          const historySnapshot = await getDocs(historyQuery);
          const historyData = historySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as HistoryRecord));
          setHistory(historyData);
        }
      } catch (error) {
        // Aquí podríamos mostrar un error si la carga de datos falla
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = () => {
    signOut(auth); // El _layout se encargará de la redirección
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return 'No disponible';
    const date = timestamp.toDate();
    return date.toLocaleString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e8716d" />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Asistencia</Text>
        {student ? (
          <Text style={styles.studentName}>{student.name}</Text>
        ) : (
          <Text style={styles.studentName}>No hay un alumno vinculado.</Text>
        )}
      </View>
      
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.recordItem}>
            <View style={[styles.iconContainer, { backgroundColor: item.type === 'entry' ? '#28a745' : '#4a5568' }]}>
              <Ionicons name={item.type === 'entry' ? 'arrow-down' : 'arrow-up'} size={24} color="white" />
            </View>
            <View style={styles.recordDetails}>
              <Text style={styles.recordType}>{item.type === 'entry' ? 'Entrada' : 'Salida'}</Text>
              <Text style={styles.recordTimestamp}>{formatTimestamp(item.timestamp)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay registros de asistencia para mostrar.</Text>
            </View>
          )
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fa' },
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20, width: '100%', alignItems: 'center' },
  title: { fontSize: 28, fontFamily: 'Montserrat_700Bold', color: '#1a202c' },
  studentName: { fontSize: 18, fontFamily: 'Montserrat_400Regular', color: '#4a5568', marginTop: 4 },
  listContainer: { paddingHorizontal: 20 },
  recordItem: {
    backgroundColor: 'white', flexDirection: 'row', alignItems: 'center',
    padding: 15, borderRadius: 12, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  iconContainer: { padding: 12, borderRadius: 50, marginRight: 15 },
  recordDetails: { flex: 1 },
  recordType: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: '#1a202c', textTransform: 'capitalize' },
  recordTimestamp: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#a0aec0', marginTop: 2 },
  emptyContainer: { flex: 1, marginTop: '40%', alignItems: 'center' },
  emptyText: { fontSize: 16, fontFamily: 'Montserrat_400Regular', color: '#a0aec0' },
  footer: { alignItems: 'center', padding: 10 },
  logoutText: { fontFamily: 'Montserrat_400Regular', color: '#a0aec0', fontSize: 16 }
});

export default DashboardScreen;