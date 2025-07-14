import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthProvider extends ChangeNotifier {
  final SupabaseClient _supabase = Supabase.instance.client;
  User? _user;
  bool _isLoading = false;
  String? _errorMessage;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Display name for UI
  String get displayName {
    if (_user?.userMetadata != null) {
      final firstName = _user!.userMetadata!['first_name'];
      final lastName = _user!.userMetadata!['last_name'];
      if (firstName != null && lastName != null) {
        return '$firstName $lastName';
      }
      if (firstName != null) return firstName;
    }
    return _user?.email?.split('@')[0] ?? 'User';
  }

  String get userEmail => _user?.email ?? '';
  String? get userPhone => _user?.userMetadata?['phone'];

  AuthProvider() {
    _initialize();
  }

  void _initialize() {
    _user = _supabase.auth.currentUser;

    // Listen to auth state changes
    _supabase.auth.onAuthStateChange.listen((data) {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      _user = session?.user;
      notifyListeners();
    });
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      print('Sign up attempt for email: $email');
      print(
        'Sign up data: firstName=$firstName, lastName=$lastName, phone=$phone',
      );

      // Create user in Supabase Auth with metadata
      final AuthResponse response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'first_name': firstName, 'last_name': lastName, 'phone': phone},
      );

      print('Sign up response user: ${response.user?.toJson()}');
      print('Sign up response session: ${response.session?.toJson()}');
      print(
        'Sign up response error: ${response.session?.user.emailConfirmedAt}',
      );

      if (response.user != null) {
        _user = response.user;
        print('User created successfully with ID: ${response.user!.id}');

        // Check if email confirmation is required
        if (response.session == null) {
          print('Email confirmation required - no session created');
          _errorMessage =
              'Kayıt başarılı! Email adresinizi kontrol edin ve doğrulama linkine tıklayın.';
          _isLoading = false;
          notifyListeners();
          return false; // Return false because user needs to confirm email
        }

        print('User logged in successfully with session');
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        print('Sign up failed - no user returned');
        _errorMessage = 'Kayıt oluşturulamadı';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on AuthException catch (error) {
      print('Auth error: ${error.message}');
      print('Auth error code: ${error.statusCode}');
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      print('General error: $error');
      _errorMessage = 'Bir hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signIn(String email, String password) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final AuthResponse response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user != null) {
        _user = response.user;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = 'Giriş başarısız';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on AuthException catch (error) {
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      _errorMessage = 'Bir hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    try {
      await _supabase.auth.signOut();
      _user = null;
      notifyListeners();
    } catch (error) {
      _errorMessage = 'Çıkış yapılırken hata oluştu: $error';
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  String _getErrorMessage(String? message) {
    if (message == null) return 'Bilinmeyen bir hata oluştu';

    if (message.contains('Invalid login credentials')) {
      return 'Email veya şifre hatalı';
    }
    if (message.contains('Email not confirmed')) {
      return 'Email adresi doğrulanmamış';
    }
    if (message.contains('Too many requests')) {
      return 'Çok fazla deneme. Lütfen biraz bekleyin';
    }
    if (message.contains('User already registered')) {
      return 'Bu email adresi zaten kayıtlı';
    }
    if (message.contains('Password should be at least')) {
      return 'Şifre en az 6 karakter olmalı';
    }

    return message;
  }

  Future<bool> sendEmailVerification(String email) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final response = await _supabase.auth.resend(
        type: OtpType.signup,
        email: email,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } on AuthException catch (error) {
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      _errorMessage = 'Bir hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Kullanıcı kendi şifresini değiştirir
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _supabase.auth.updateUser(UserAttributes(password: newPassword));

      _isLoading = false;
      notifyListeners();
      return true;
    } on AuthException catch (error) {
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      _errorMessage = 'Şifre değiştirme sırasında hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Admin kullanıcıya şifre sıfırlama maili gönderir
  Future<bool> sendPasswordResetEmail(String email) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _supabase.auth.resetPasswordForEmail(email);

      _isLoading = false;
      notifyListeners();
      return true;
    } on AuthException catch (error) {
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      _errorMessage = 'Şifre sıfırlama maili gönderilirken hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Kullanıcı bilgilerini günceller (şifre hariç)
  Future<bool> updateUserProfile({
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final userData = <String, dynamic>{};
      if (firstName != null) userData['first_name'] = firstName;
      if (lastName != null) userData['last_name'] = lastName;
      if (phone != null) userData['phone'] = phone;

      final response = await _supabase.auth.updateUser(
        UserAttributes(data: userData),
      );

      // Local user bilgilerini güncelle
      if (response.user != null) {
        _user = response.user;
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } on AuthException catch (error) {
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      _errorMessage = 'Profil güncellenirken hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Kullanıcı kendi hesabını siler
  Future<bool> deleteCurrentUser() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      if (_user == null) {
        _errorMessage = 'Kullanıcı bulunamadı';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      // Kullanıcı kendi hesabını silebilir
      await _supabase.auth.admin.deleteUser(_user!.id);

      _user = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } on AuthException catch (error) {
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      _errorMessage = 'Hesap silinirken hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Admin: Belirli bir kullanıcıyı ID ile siler
  Future<bool> deleteUserById(String userId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      print('Deleting user with ID: $userId');

      // HTTP request ile admin API'yi kullan
      final url =
          'https://ugmyyphiqoahludwuzpu.supabase.co/auth/v1/admin/users/$userId';

      // NOT: Bu service role key'i sadece test amaçlı kullanın!
      // Production'da backend API kullanın
      const serviceRoleKey =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI'; // Supabase Dashboard'dan alın

      final response = await http.delete(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $serviceRoleKey',
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
      );

      print('Delete response status: ${response.statusCode}');
      print('Delete response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 204) {
        print('User deleted successfully');
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        print('Delete failed with status: ${response.statusCode}');
        _errorMessage = 'Kullanıcı silinemedi: ${response.statusCode}';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on AuthException catch (error) {
      print('Auth error while deleting user: ${error.message}');
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      print('General error while deleting user: $error');
      _errorMessage = 'Kullanıcı silinirken hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Kullanıcıyı devre dışı bırak (soft delete)
  Future<bool> deactivateUser(String userId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      print('Deactivating user with ID: $userId');

      // HTTP request ile admin API'yi kullan
      final url =
          'https://ugmyyphiqoahludwuzpu.supabase.co/auth/v1/admin/users/$userId';

      // NOT: Bu service role key'i sadece test amaçlı kullanın!
      // Production'da backend API kullanın
      const serviceRoleKey =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI';

      final response = await http.put(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $serviceRoleKey',
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'user_metadata': {
            'is_active': false,
            'deleted_at': DateTime.now().toIso8601String(),
          },
        }),
      );

      print('Deactivate response status: ${response.statusCode}');
      print('Deactivate response body: ${response.body}');

      if (response.statusCode == 200) {
        print('User deactivated successfully');
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        print('Deactivate failed with status: ${response.statusCode}');
        _errorMessage =
            'Kullanıcı devre dışı bırakılamadı: ${response.statusCode}';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on AuthException catch (error) {
      print('Auth error while deactivating user: ${error.message}');
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      print('General error while deactivating user: $error');
      _errorMessage = 'Kullanıcı devre dışı bırakılırken hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Kullanıcıyı tekrar aktif hale getir
  Future<bool> activateUser(String userId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      print('Activating user with ID: $userId');

      // HTTP request ile admin API'yi kullan
      final url =
          'https://ugmyyphiqoahludwuzpu.supabase.co/auth/v1/admin/users/$userId';

      // NOT: Bu service role key'i sadece test amaçlı kullanın!
      // Production'da backend API kullanın
      const serviceRoleKey =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI';

      final response = await http.put(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $serviceRoleKey',
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'user_metadata': {
            'is_active': true,
            'deleted_at': null,
            'activated_at': DateTime.now().toIso8601String(),
          },
        }),
      );

      print('Activate response status: ${response.statusCode}');
      print('Activate response body: ${response.body}');

      if (response.statusCode == 200) {
        print('User activated successfully');
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        print('Activate failed with status: ${response.statusCode}');
        _errorMessage =
            'Kullanıcı aktif hale getirilemedi: ${response.statusCode}';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on AuthException catch (error) {
      print('Auth error while activating user: ${error.message}');
      _errorMessage = _getErrorMessage(error.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      print('General error while activating user: $error');
      _errorMessage = 'Kullanıcı aktif hale getirilirken hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Kullanıcıyı soft delete ile işaretler (user_metadata'da deleted_at)
  Future<bool> softDeleteUserByRestApi(String userId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      print('Soft deleting user with ID: $userId');

      // Supabase Admin API endpoint
      final url =
          'https://ugmyyphiqoahludwuzpu.supabase.co/auth/v1/admin/users/$userId';

      // Service role key (DİKKAT: Sadece test için!)
      const serviceRoleKey =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI';

      final now = DateTime.now().toUtc().toIso8601String();
      final response = await http.put(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $serviceRoleKey',
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'user_metadata': {'deleted_at': now, 'is_deleted': true},
        }),
      );

      print('Soft delete response status: ${response.statusCode}');
      print('Soft delete response body: ${response.body}');

      if (response.statusCode == 200) {
        print('User soft deleted (deleted_at in user_metadata) successfully');
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        print('Soft delete failed with status: ${response.statusCode}');
        _errorMessage = 'Kullanıcı soft silinemedi: ${response.statusCode}';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (error) {
      print('General error while soft deleting user: $error');
      _errorMessage = 'Kullanıcı soft silinirken hata oluştu: $error';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
