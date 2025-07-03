import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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
        'Sign up response error: ${response.session?.user?.emailConfirmedAt}',
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
}
