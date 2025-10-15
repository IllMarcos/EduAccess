import { View, Text, StyleSheet, Pressable, SectionList, ActivityIndicator, StatusBar, Modal, TouchableOpacity, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// CAMBIO: Se elimina 'orderBy' y se añade 'useCallback'
import { collection, query, where, getDocs, collectionGroup, Timestamp } from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';
import QRCode from 'react-native-qrcode-svg';

// CAMBIO: Se obtiene el ancho de la pantalla
const { width } = Dimensions.get('window');

type Student = {
  id: string;
  name: string;
  qrId: string;
};

type HistoryRecord = {
  id: string;
  type: 'entry' | 'exit';
  timestamp: Timestamp;
};

type SectionedData = {
  title: string;
  data: HistoryRecord[];
};

const DashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [sectionedHistory, setSectionedHistory] = useState<SectionedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const studentsQuery = query(collectionGroup(db, 'students'), where('tutorUid', '==', user.uid));
        const studentSnapshot = await getDocs(studentsQuery);

        if (!studentSnapshot.empty) {
          const studentDoc = studentSnapshot.docs[0];
          const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
          setStudent(studentData);

          const historyQuery = query(collection(db, 'history'), where('studentId', '==', studentDoc.id));
          const historySnapshot = await getDocs(historyQuery);
          
          let historyData = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryRecord));
          
          const grouped = historyData.reduce((acc, record) => {
            const date = record.timestamp.toDate().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(record);
            return acc;
          }, {} as Record<string, HistoryRecord[]>);

          const sections = Object.keys(grouped).map(date => ({
            title: date,
            data: grouped[date].sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()),
          })).sort((a, b) => {
              // Asegurarse que hay elementos antes de acceder a ellos
              if (grouped[b.title]?.[0] && grouped[a.title]?.[0]) {
                return grouped[b.title][0].timestamp.toMillis() - grouped[a.title][0].timestamp.toMillis();
              }
              return 0;
          });

          setSectionedHistory(sections);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return 'No disponible';
    return timestamp.toDate().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
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
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.userName}>{user?.displayName || user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={28} color="#a0aec0" />
        </TouchableOpacity>
      </View>

      <View style={styles.studentCard}>
        <Text style={styles.studentCardLabel}>Historial de asistencia para:</Text>
        <Text style={styles.studentName}>{student ? student.name : 'Alumno no vinculado'}</Text>
      </View>
      
      <SectionList
        sections={sectionedHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.recordItem}>
            <View style={[styles.iconContainer, { backgroundColor: item.type === 'entry' ? '#28a745' : '#4a5568' }]}>
              <Ionicons name={item.type === 'entry' ? 'arrow-down' : 'arrow-up'} size={24} color="white" />
            </View>
            <View style={styles.recordDetails}>
              <Text style={styles.recordType}>{item.type === 'entry' ? 'Entrada Registrada' : 'Salida Registrada'}</Text>
              <Text style={styles.recordTimestamp}>{formatTimestamp(item.timestamp)}</Text>
            </View>
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListEmptyComponent={() => (
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay registros de asistencia.</Text>
            </View>
          )
        )}
      />

      {student?.qrId && (
        <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={() => setQrModalVisible(true)}>
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="white" />
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContainer}>
            <Text style={styles.modalTitle}>QR de {student?.name}</Text>
            <View style={styles.qrCodeWrapper}>
              {student?.qrId && <QRCode value={student.qrId} size={width * 0.6} />}
            </View>
            <Text style={styles.modalMessage}>Muestra este código en la entrada de la escuela.</Text>
            <Pressable style={styles.closeModalButton} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- (Estilos sin cambios) ---
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  greeting: { fontFamily: 'Montserrat_400Regular', fontSize: 16, color: '#a0aec0' },
  userName: { fontFamily: 'Montserrat_700Bold', fontSize: 24, color: '#1a202c' },
  logoutButton: { padding: 8 },
  studentCard: {
    backgroundColor: 'white', marginHorizontal: 20, borderRadius: 12, padding: 20, marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5,
  },
  studentCardLabel: { fontFamily: 'Montserrat_400Regular', color: '#a0aec0', fontSize: 14 },
  studentName: { fontFamily: 'Montserrat_700Bold', color: '#1a202c', fontSize: 20, marginTop: 4 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: {
    fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#1a202c',
    paddingVertical: 10, paddingTop: 20, backgroundColor: '#f4f7fa', textTransform: 'capitalize'
  },
  recordItem: {
    backgroundColor: 'white', flexDirection: 'row', alignItems: 'center',
    padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#e2e8f0'
  },
  iconContainer: { padding: 12, borderRadius: 50, marginRight: 15 },
  recordDetails: { flex: 1 },
  recordType: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: '#1a202c' },
  recordTimestamp: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#a0aec0', marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 300 },
  emptyText: { fontSize: 16, fontFamily: 'Montserrat_400Regular', color: '#a0aec0' },
  fab: {
    position: 'absolute', right: 20, backgroundColor: '#e8716d',
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8,
  },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  qrModalContainer: {
    width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', color: '#1a202c', marginBottom: 20, textAlign: 'center' },
  qrCodeWrapper: { padding: 15, backgroundColor: 'white', borderRadius: 8, marginBottom: 20 },
  modalMessage: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#4a5568', textAlign: 'center' },
  closeModalButton: { backgroundColor: '#e8716d', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 30, marginTop: 20 },
  closeModalButtonText: { color: 'white', fontFamily: 'Montserrat_500Medium', fontSize: 16 },
});

export default DashboardScreen;