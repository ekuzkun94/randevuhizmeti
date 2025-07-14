import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Admin işlemleri için ayrı Firebase yapılandırması
const adminFirebaseConfig = {
  apiKey: "AIzaSyCGnZdk7ffOGZHVICfgJ7OHgCaE2_oA7gI",
  authDomain: "zamanyonet-90325.firebaseapp.com",
  projectId: "zamanyonet-90325",
  storageBucket: "zamanyonet-90325.firebasestorage.app",
  messagingSenderId: "1019154939488",
  appId: "1:1019154939488:web:c502f6e2687a8498c48d05",
  measurementId: "G-XXYS1E0YFN"
};

// Admin işlemleri için ayrı Firebase app instance
const adminApp = initializeApp(adminFirebaseConfig, 'admin');
export const adminAuth = getAuth(adminApp); 