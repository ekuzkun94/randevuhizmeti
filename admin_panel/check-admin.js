const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function checkAdminUser() {
  try {
    console.log('Firebase config:', {
      apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
      authDomain: firebaseConfig.authDomain ? 'Set' : 'Missing',
      projectId: firebaseConfig.projectId ? 'Set' : 'Missing',
    });

    // Admin kullanıcısı ile giriş yap
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'admin@demo.com', 
      'demo123'
    );
    
    const user = userCredential.user;
    console.log('✅ Admin kullanıcısı ile giriş başarılı:', user.email);

    // Firestore'dan kullanıcı bilgilerini al
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Firestore kullanıcı verisi bulundu:', userData);
      console.log('Role:', userData.role);
    } else {
      console.log('❌ Firestore\'da kullanıcı verisi bulunamadı!');
      console.log('Kullanıcı ID:', user.uid);
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('Error code:', error.code);
  }
}

checkAdminUser(); 