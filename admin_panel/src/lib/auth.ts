import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { User } from '@/types/auth';

export const loginUser = async (email: string, password: string) => {
  try {
    console.log('Login attempt:', { email });
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful:', userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Login error:', error);
    let errorMessage = error.message;
    
    // Firebase hata mesajlarını Türkçe'ye çevir
    switch (error.code) {
      case 'auth/configuration-not-found':
        errorMessage = 'Firebase yapılandırması bulunamadı. Lütfen Firebase Console\'da Authentication\'ı etkinleştirin.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Bu email adresi ile kayıtlı kullanıcı bulunamadı.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Hatalı şifre.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Geçersiz email adresi.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.';
        break;
      default:
        errorMessage = 'Giriş yapılırken bir hata oluştu.';
    }
    
    return { user: null, error: errorMessage };
  }
};

export const registerUser = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await userCredential.user.updateProfile({
      displayName: name
    });
    
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Convert Firebase User to our User type
export const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || undefined,
    role: 'user', // Default role, you can customize this
    created_at: firebaseUser.metadata.creationTime || new Date().toISOString()
  };
}; 