import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/hybrid_api_service.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;
  String? _token;
  String? _refreshToken;
  Timer? _sessionTimer;
  Timer? _refreshTimer;

  // Session timeout (30 dakika)
  static const int _sessionTimeoutMinutes = 30;
  static const int _refreshIntervalMinutes = 25;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null && _token != null;
  String? get token => _token;

  // Role-based permissions
  Map<String, List<String>> get rolePermissions => {
        '1': [
          // Admin
          'admin.dashboard',
          'admin.users.view',
          'admin.users.create',
          'admin.users.edit',
          'admin.users.delete',
          'admin.appointments.view',
          'admin.appointments.manage',
          'admin.services.view',
          'admin.services.manage',
          'admin.roles.view',
          'admin.roles.manage',
          'system.settings',
        ],
        '2': [
          // Provider
          'provider.dashboard',
          'provider.appointments.view',
          'provider.appointments.manage',
          'provider.services.view',
          'provider.services.manage',
          'provider.schedule.view',
          'provider.schedule.manage',
          'provider.profile.edit',
        ],
        '3': [
          // Customer
          'customer.dashboard',
          'customer.appointments.view',
          'customer.appointments.create',
          'customer.appointments.cancel',
          'customer.profile.view',
          'customer.profile.edit',
          'customer.providers.view',
        ],
      };

  AuthProvider() {
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    await _loadStoredAuth();
  }

  // Permission kontrolü
  bool hasPermission(String permission) {
    if (_currentUser == null) return false;

    final userPermissions = rolePermissions[_currentUser!.roleId] ?? [];
    return userPermissions.contains(permission);
  }

  // Role kontrolü
  bool hasRole(String roleId) {
    return _currentUser?.roleId == roleId;
  }

  bool get isAdmin => hasRole('1');
  bool get isProvider => hasRole('2');
  bool get isCustomer => hasRole('3');

  Future<bool> login(String email, String password, String roleId) async {
    try {
      _setLoading(true);
      _clearError();

      // API'ye giriş isteği gönder
      final hybridApi = HybridApiService();
      final response = await hybridApi.login(email, password);

      if (response['user'] != null) {
        final userData = response['user'];

        // Mock token oluştur (API'de token sistemi henüz yok)
        _token = _generateMockToken({
          'id': userData['id'],
          'email': userData['email'],
          'roleId': userData['role_id'],
        });
        _refreshToken = _generateMockRefreshToken();

        _currentUser = UserModel(
          id: userData['id'],
          name: userData['name'],
          email: userData['email'],
          roleId: userData['role_id'],
          createdAt: DateTime.parse(userData['created_at']),
          updatedAt: DateTime.parse(userData['updated_at']),
        );

        await _storeAuth();
        _startSessionTimer();
        _startRefreshTimer();

        _setLoading(false);
        notifyListeners();
        return true;
      } else {
        _setError(response['error'] ?? 'Giriş başarısız');
        return false;
      }
    } catch (e) {
      // Hata durumunda mock kullanıcı sistemine geri dön
      debugPrint('API giriş hatası: $e');
      return await _mockLogin(email, password, roleId);
    } finally {
      _setLoading(false);
    }
  }

  // Enhanced mock giriş sistemi
  Future<bool> _mockLogin(String email, String password, String roleId) async {
    try {
      _setLoading(true);
      _clearError();

      // Güvenlik: Email format kontrolü
      if (!_isValidEmail(email)) {
        _setError('Geçerli bir e-posta adresi giriniz');
        return false;
      }

      // Güvenlik: Şifre uzunluk kontrolü
      if (password.length < 3) {
        _setError('Şifre en az 3 karakter olmalıdır');
        return false;
      }

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
        // Hızlı test için kısa alternatifler
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
        'customer@example.com': {
          'id': 'customer-123',
          'name': 'Customer User',
          'email': 'customer@example.com',
          'roleId': '3',
          'password': 'customer123'
        },
        'provider@example.com': {
          'id': 'provider-123',
          'name': 'Dr. Provider User',
          'email': 'provider@example.com',
          'roleId': '2',
          'password': 'provider123'
        },
      };

      if (testUsers.containsKey(email) &&
          testUsers[email]!['password'] == password) {
        final userData = testUsers[email]!;

        // RoleId kontrolü
        if (roleId.isNotEmpty && userData['roleId'] != roleId) {
          _setError('Bu role ile giriş yetkiniz yok');
          return false;
        }

        // Mock JWT token oluştur
        _token = _generateMockToken(userData);
        _refreshToken = _generateMockRefreshToken();

        _currentUser = UserModel(
          id: userData['id']!,
          name: userData['name']!,
          email: userData['email']!,
          roleId: userData['roleId']!,
          password: userData['password']!,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        await _storeAuth();
        _startSessionTimer();
        _startRefreshTimer();

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

  // Session timer - otomatik çıkış
  void _startSessionTimer() {
    _sessionTimer?.cancel();
    _sessionTimer = Timer(const Duration(minutes: _sessionTimeoutMinutes), () {
      _handleSessionTimeout();
    });
  }

  // Token refresh timer
  void _startRefreshTimer() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer(const Duration(minutes: _refreshIntervalMinutes), () {
      _refreshTokenIfNeeded();
    });
  }

  void _handleSessionTimeout() {
    _setError('Oturum süresi doldu. Tekrar giriş yapınız.');
    signOut();
  }

  Future<void> _refreshTokenIfNeeded() async {
    if (_refreshToken == null) return;

    try {
      // API'ye token refresh isteği
      final response = await ApiService.refreshToken(_refreshToken!);

      if (response['token'] != null) {
        _token = response['token'];
        _refreshToken = response['refreshToken'];
        await _storeAuth();
        _startRefreshTimer(); // Yeni timer başlat
      } else {
        await signOut(); // Token refresh başarısız
      }
    } catch (e) {
      // Mock token refresh
      _token = _generateMockToken({
        'id': _currentUser!.id,
        'email': _currentUser!.email,
        'roleId': _currentUser!.roleId,
      });
      await _storeAuth();
      _startRefreshTimer();
    }
  }

  // Auth verilerini cihazda sakla
  Future<void> _storeAuth() async {
    final prefs = await SharedPreferences.getInstance();
    if (_currentUser != null && _token != null) {
      await prefs.setString('user_data', jsonEncode(_currentUser!.toJson()));
      await prefs.setString('auth_token', _token!);
      await prefs.setString('refresh_token', _refreshToken ?? '');
      await prefs.setInt(
          'login_timestamp', DateTime.now().millisecondsSinceEpoch);
    }
  }

  // Saklanan auth verilerini yükle
  Future<void> _loadStoredAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final userData = prefs.getString('user_data');
    final token = prefs.getString('auth_token');
    final refreshToken = prefs.getString('refresh_token');
    final loginTimestamp = prefs.getInt('login_timestamp');

    if (userData != null && token != null && loginTimestamp != null) {
      // Token süre kontrolü
      final loginTime = DateTime.fromMillisecondsSinceEpoch(loginTimestamp);
      final timeDifference = DateTime.now().difference(loginTime);

      if (timeDifference.inMinutes < _sessionTimeoutMinutes) {
        _currentUser = UserModel.fromJson(jsonDecode(userData));
        _token = token;
        _refreshToken = refreshToken;

        // Kalan süre için timer başlat
        final remainingMinutes =
            _sessionTimeoutMinutes - timeDifference.inMinutes;
        _sessionTimer = Timer(Duration(minutes: remainingMinutes), () {
          _handleSessionTimeout();
        });

        _startRefreshTimer();
        notifyListeners();
      } else {
        // Token süresi dolmuş
        await _clearStoredAuth();
      }
    }
  }

  Future<void> signOut() async {
    try {
      _sessionTimer?.cancel();
      _refreshTimer?.cancel();
      _currentUser = null;
      _token = null;
      _refreshToken = null;
      await _clearStoredAuth();
      _clearError();
      notifyListeners();
    } catch (e) {
      _setError('Çıkış yapılırken hata oluştu');
    }
  }

  Future<void> _clearStoredAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
    await prefs.remove('login_timestamp');
  }

  // Security helper methods
  bool _isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  String _generateMockToken(Map<String, dynamic> userData) {
    final header =
        base64Encode(utf8.encode(jsonEncode({'typ': 'JWT', 'alg': 'HS256'})));

    final payload = base64Encode(utf8.encode(jsonEncode({
      'sub': userData['id'],
      'email': userData['email'],
      'role': userData['roleId'],
      'iat': DateTime.now().millisecondsSinceEpoch ~/ 1000,
      'exp': DateTime.now()
              .add(const Duration(minutes: _sessionTimeoutMinutes))
              .millisecondsSinceEpoch ~/
          1000,
    })));

    return '$header.$payload.mock_signature';
  }

  String _generateMockRefreshToken() {
    const chars =
        'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890';
    return String.fromCharCodes(Iterable.generate(
        64,
        (_) => chars.codeUnitAt(
            (DateTime.now().millisecondsSinceEpoch * 13) % chars.length)));
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

  // Profile güncelleme methodu
  Future<bool> updateUserProfile({
    String? name,
    String? email,
    String? phone,
  }) async {
    try {
      if (_currentUser == null) {
        _setError('Kullanıcı oturumu bulunamadı');
        return false;
      }

      _setLoading(true);
      _clearError();

      // API'ye profil güncelleme isteği gönder
      try {
        final userId = _currentUser!.id;
        if (userId == null) {
          _setError('Kullanıcı ID bulunamadı');
          return false;
        }

        final response = await ApiService.updateProfile(
          userId: userId,
          name: name,
          email: email,
          phone: phone,
        );

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

          await _storeAuth();
          notifyListeners();
          return true;
        } else {
          _setError(response['error'] ?? 'Profil güncellenemedi');
          return false;
        }
      } catch (e) {
        // API hatası durumunda local güncelleme
        debugPrint('API profil güncelleme hatası: $e');

        _currentUser = UserModel(
          id: _currentUser!.id,
          name: name ?? _currentUser!.name,
          email: email ?? _currentUser!.email,
          roleId: _currentUser!.roleId,
          password: _currentUser!.password,
          createdAt: _currentUser!.createdAt,
          updatedAt: DateTime.now(),
        );

        await _storeAuth();
        notifyListeners();
        return true;
      }
    } catch (e) {
      _setError('Profil güncellenirken hata: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  @override
  void dispose() {
    _sessionTimer?.cancel();
    _refreshTimer?.cancel();
    super.dispose();
  }
}
