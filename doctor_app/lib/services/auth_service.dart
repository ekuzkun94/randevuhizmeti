import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get current user
  User? get currentUser => _auth.currentUser;

  // Auth state changes stream
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Sign in with email and password
  Future<UserModel> signInWithEmailAndPassword(String email, String password) async {
    try {
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      if (userCredential.user == null) {
        throw Exception('Giriş başarısız');
      }

      try {
        return await getUserData(userCredential.user!.uid);
      } catch (e) {
        // Kullanıcı verisi alınamadıysa, oturumu kapat
        await _auth.signOut();
        if (e.toString().contains('client is offline')) {
          throw Exception('İnternet bağlantınızı kontrol edin');
        } else if (e.toString().contains('permission-denied')) {
          throw Exception('Kullanıcı verilerine erişim izniniz yok. Lütfen yönetici ile iletişime geçin.');
        }
        throw Exception('Kullanıcı verisi alınamadı: $e');
      }
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'user-not-found':
          throw Exception('Kullanıcı bulunamadı');
        case 'wrong-password':
          throw Exception('Hatalı şifre');
        case 'invalid-email':
          throw Exception('Geçersiz e-posta adresi');
        case 'user-disabled':
          throw Exception('Hesabınız devre dışı bırakılmış');
        case 'too-many-requests':
          throw Exception('Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin');
        default:
          throw Exception('Giriş yapılamadı: ${e.message}');
      }
    } catch (e) {
      throw Exception('Giriş yapılamadı: $e');
    }
  }

  Future<UserModel> getUserData(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (!doc.exists) {
        throw Exception('Kullanıcı bulunamadı');
      }
      return UserModel.fromMap(doc.data()!);
    } on FirebaseException catch (e) {
      if (e.code == 'failed-precondition') {
        throw Exception('Firestore veritabanı henüz oluşturulmamış');
      } else if (e.code == 'permission-denied') {
        throw Exception('Kullanıcı verilerine erişim izniniz yok. Lütfen yönetici ile iletişime geçin.');
      } else if (e.toString().contains('client is offline')) {
        throw Exception('İnternet bağlantınızı kontrol edin');
      }
      throw Exception('Firestore hatası: ${e.message}');
    } catch (e) {
      throw Exception('Kullanıcı verisi alınamadı: $e');
    }
  }

  // Sign in with phone number
  Future<UserModel?> signInWithPhone(String phoneNumber) async {
    try {
      // TODO: Implement phone authentication
      // This requires additional setup with Firebase Phone Auth
      return null;
    } catch (e) {
      print('Error signing in with phone: $e');
      rethrow;
    }
  }

  // Register with email and password
  Future<UserModel> registerWithEmailAndPassword({
    required String email,
    required String password,
    required String name,
    required String phone,
    required UserRole role,
    String? businessName,
    String? address,
    String? taxNumber,
  }) async {
    try {
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (userCredential.user == null) {
        throw Exception('Kayıt başarısız');
      }

      final now = DateTime.now();
      final user = UserModel(
        id: userCredential.user!.uid,
        name: name,
        email: email,
        phone: phone,
        role: role,
        businessName: businessName,
        address: address,
        taxNumber: taxNumber,
        createdAt: now,
        updatedAt: now,
      );

      try {
        await _firestore.collection('users').doc(user.id).set(user.toMap());
        return user;
      } catch (e) {
        // Firestore kayıt hatası durumunda, oluşturulan kullanıcıyı sil
        await userCredential.user!.delete();
        if (e.toString().contains('client is offline')) {
          throw Exception('İnternet bağlantınızı kontrol edin');
        } else if (e.toString().contains('permission-denied')) {
          throw Exception('Kullanıcı verisi kaydetme izniniz yok. Lütfen yönetici ile iletişime geçin.');
        }
        throw Exception('Kullanıcı verisi kaydedilemedi: $e');
      }
    } catch (e) {
      if (e.toString().contains('email-already-in-use')) {
        throw Exception('Bu e-posta adresi zaten kullanımda');
      } else if (e.toString().contains('invalid-email')) {
        throw Exception('Geçersiz e-posta adresi');
      } else if (e.toString().contains('weak-password')) {
        throw Exception('Şifre çok zayıf');
      } else if (e.toString().contains('operation-not-allowed')) {
        throw Exception('E-posta/şifre girişi etkin değil');
      } else if (e.toString().contains('client is offline')) {
        throw Exception('İnternet bağlantınızı kontrol edin');
      }
      throw Exception('Kayıt yapılamadı: $e');
    }
  }

  // Update user profile
  Future<void> updateProfile(UserModel updatedUser) async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        throw Exception('Oturum açık değil');
      }

      if (currentUser.uid != updatedUser.id) {
        throw Exception('Yetkisiz işlem');
      }

      await _firestore.collection('users').doc(updatedUser.id).update(updatedUser.toMap());
    } on FirebaseException catch (e) {
      if (e.code == 'permission-denied') {
        throw Exception('Profil güncelleme izniniz yok');
      } else if (e.toString().contains('client is offline')) {
        throw Exception('İnternet bağlantınızı kontrol edin');
      }
      throw Exception('Profil güncellenemedi: ${e.message}');
    } catch (e) {
      throw Exception('Profil güncellenemedi: $e');
    }
  }

  // Change password
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        throw Exception('Oturum açık değil');
      }

      if (currentUser.email == null) {
        throw Exception('E-posta adresi bulunamadı');
      }

      // Önce mevcut şifreyi doğrula
      final credential = EmailAuthProvider.credential(
        email: currentUser.email!,
        password: currentPassword,
      );

      await currentUser.reauthenticateWithCredential(credential);
      await currentUser.updatePassword(newPassword);
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'wrong-password':
          throw Exception('Mevcut şifre hatalı');
        case 'weak-password':
          throw Exception('Yeni şifre çok zayıf');
        case 'requires-recent-login':
          throw Exception('Güvenlik nedeniyle tekrar giriş yapmanız gerekiyor');
        default:
          throw Exception('Şifre değiştirilemedi: ${e.message}');
      }
    } catch (e) {
      throw Exception('Şifre değiştirilemedi: $e');
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _auth.signOut();
    } on FirebaseAuthException catch (e) {
      throw Exception('Çıkış yapılamadı: ${e.message}');
    } catch (e) {
      throw Exception('Çıkış yapılamadı: $e');
    }
  }
} 