import 'package:flutter/material.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null;

  Future<bool> login(String email, String password, String roleId) async {
    try {
      _setLoading(true);
      _clearError();

      // Basit test kullanıcıları
      final testUsers = {
        'admin@example.com': {
          'id': 'admin-001',
          'name': 'Admin User',
          'email': 'admin@example.com',
          'roleId': '1',
          'password': 'admin123'
        },
        'ahmet@example.com': {
          'id': 'provider-001',
          'name': 'Dr. Ahmet Yılmaz',
          'email': 'ahmet@example.com',
          'roleId': '2',
          'password': 'provider123'
        },
        'mehmet@example.com': {
          'id': 'customer-001',
          'name': 'Mehmet Kaya',
          'email': 'mehmet@example.com',
          'roleId': '3',
          'password': 'customer123'
        },
      };

      if (testUsers.containsKey(email) && testUsers[email]!['password'] == password) {
        final userData = testUsers[email]!;
        _currentUser = UserModel(
          id: userData['id']!,
          name: userData['name']!,
          email: userData['email']!,
          roleId: userData['roleId']!,
          password: userData['password']!,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        _setLoading(false);
        notifyListeners();
        return true;
      } else {
        _setError('Geçersiz e-posta veya şifre');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signOut() async {
    try {
      _currentUser = null;
      _clearError();
      notifyListeners();
    } catch (e) {
      _setError('Çıkış yapılırken hata oluştu');
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _errorMessage = error;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void clearError() {
    _clearError();
  }
} 