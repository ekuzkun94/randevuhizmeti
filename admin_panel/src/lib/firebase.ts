import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCGnZdk7ffOGZHVICfgJ7OHgCaE2_oA7gI",
  authDomain: "zamanyonet-90325.firebaseapp.com",
  projectId: "zamanyonet-90325",
  storageBucket: "zamanyonet-90325.firebasestorage.app",
  messagingSenderId: "1019154939488",
  appId: "1:1019154939488:web:c502f6e2687a8498c48d05",
  measurementId: "G-XXYS1E0YFN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app; 