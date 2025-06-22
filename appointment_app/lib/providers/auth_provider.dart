import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

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

      // API'ye giriş isteği gönder
      final response = await ApiService.login(email, password, roleId);
      
      if (response['user'] != null) {
        final userData = response['user'];
        _currentUser = UserModel(
          id: userData['id'],
          name: userData['name'],
          email: userData['email'],
          roleId: userData['role_id'],
          createdAt: DateTime.parse(userData['created_at']),
          updatedAt: DateTime.parse(userData['updated_at']),
        );
        _setLoading(false);
        notifyListeners();
        return true;
      } else {
        _setError(response['error'] ?? 'Giriş başarısız');
        return false;
      }
    } catch (e) {
      // Hata durumunda mock kullanıcı sistemine geri dön
      print('API giriş hatası: $e');
      return await _mockLogin(email, password, roleId);
    } finally {
      _setLoading(false);
    }
  }

  // Fallback mock giriş sistemi (API erişilemediğinde)
  Future<bool> _mockLogin(String email, String password, String roleId) async {
    try {
      _setLoading(true);
      _clearError();

      // Basit test kullanıcıları
      final testUsers = {
        'a@a.com': {
          'id': 'admin-001',
          'name': 'Admin User',
          'email': 'a@a.com',
          'roleId': '1',
          'password': '123'
        },
        'p@p.com': {
          'id': 'provider-001',
          'name': 'Dr. Ahmet Yılmaz',
          'email': 'p@p.com',
          'roleId': '2',
          'password': '123'
        },
        'c@c.com': {
          'id': 'customer-001',
          'name': 'Mehmet Kaya',
          'email': 'c@c.com',
          'roleId': '3',
          'password': '123'
        },
      };

      if (testUsers.containsKey(email) && testUsers[email]!['password'] == password) {
        final userData = testUsers[email]!;
        
        // RoleId kontrolü
        if (roleId.isNotEmpty && userData['roleId'] != roleId) {
          _setError('Bu role ile giriş yetkiniz yok');
          return false;
        }
        
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