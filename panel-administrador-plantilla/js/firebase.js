// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJTT4h-XMynRzgR3isKHjhOgNtohsS9ls",
  authDomain: "software-escolar.firebaseapp.com",
  projectId: "software-escolar",
  storageBucket: "software-escolar.firebasestorage.app",
  messagingSenderId: "474489274371",
  appId: "1:474489274371:web:e5565095260468fd1e8e36",
  measurementId: "G-CLXF3LF2XE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);