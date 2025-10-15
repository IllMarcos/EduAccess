// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAJTT4h-XMynRzgR3isKHjhOgNtohsS9ls",
  authDomain: "software-escolar.firebaseapp.com",
  projectId: "software-escolar",
  storageBucket: "software-escolar.firebasestorage.app",
  messagingSenderId: "474489274371",
  appId: "1:474489274371:web:e5565095260468fd1e8e36",
  measurementId: "G-CLXF3LF2XE"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);