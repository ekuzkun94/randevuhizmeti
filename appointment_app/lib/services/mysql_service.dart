import 'package:mysql1/mysql1.dart';
import 'package:flutter/foundation.dart';
import 'package:appointment_app/config/database_config.dart';

class MySQLService {
  static MySQLService? _instance;
  MySqlConnection? _connection;

  MySQLService._internal();

  static MySQLService get instance {
    _instance ??= MySQLService._internal();
    return _instance!;
  }

  bool get isConnected => _connection != null;

  Future<void> connect() async {
    // Web platformunda MySQL bağlantısı desteklenmiyor
    if (kIsWeb) {
      debugPrint('Web platformunda MySQL bağlantısı atlanıyor - HTTP API kullanılacak');
      return;
    }
    
    try {
      if (_connection != null && isConnected) {
        return;
      }

      final settings = ConnectionSettings(
        host: DatabaseConfig.host,
        port: DatabaseConfig.port,
        user: DatabaseConfig.user,
        password: DatabaseConfig.password,
        db: DatabaseConfig.database,
        timeout: const Duration(seconds: DatabaseConfig.connectionTimeout),
      );

      _connection = await MySqlConnection.connect(settings);
      debugPrint('MySQL bağlantısı başarılı');
    } catch (e) {
      debugPrint('MySQL bağlantı hatası: $e');
      rethrow;
    }
  }

  Future<void> disconnect() async {
    try {
      await _connection?.close();
      _connection = null;
      debugPrint('MySQL bağlantısı kapatıldı');
    } catch (e) {
      debugPrint('MySQL bağlantı kapatma hatası: $e');
    }
  }

  Future<Results> query(String sql, [List<Object?>? values]) async {
    // Web platformunda MySQL query desteklenmiyor
    if (kIsWeb) {
      debugPrint('Web platformunda MySQL query atlanıyor: $sql');
      throw UnsupportedError('Web platformunda MySQL desteklenmiyor - HTTP API kullanın');
    }
    
    try {
      await connect();
      return await _connection!.query(sql, values);
    } catch (e) {
      debugPrint('Query hatası: $e');
      rethrow;
    }
  }

  // User operations
  Future<Map<String, dynamic>?> getUserByEmail(String email) async {
    try {
      final results = await query(
        'SELECT * FROM users WHERE email = ?',
        [email],
      );

      if (results.isNotEmpty) {
        final row = results.first;
        return {
          'id': row['id'],
          'name': row['name'],
          'email': row['email'],
          'role_id': row['role_id'],
          'password': row['password'],
          'created_at': row['created_at'].toString(),
          'updated_at': row['updated_at'].toString(),
        };
      }
      return null;
    } catch (e) {
      debugPrint('getUserByEmail hatası: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> getUserById(int id) async {
    try {
      final results = await query(
        'SELECT * FROM users WHERE id = ?',
        [id],
      );

      if (results.isNotEmpty) {
        final row = results.first;
        return {
          'id': row['id'],
          'name': row['name'],
          'email': row['email'],
          'role_id': row['role_id'],
          'created_at': row['created_at'].toString(),
          'updated_at': row['updated_at'].toString(),
        };
      }
      return null;
    } catch (e) {
      debugPrint('getUserById hatası: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getAllUsers() async {
    try {
      final results = await query('SELECT * FROM users ORDER BY created_at DESC');
      return results.map((row) => {
        'id': row['id'],
        'name': row['name'],
        'email': row['email'],
        'role_id': row['role_id'],
        'created_at': row['created_at'].toString(),
        'updated_at': row['updated_at'].toString(),
      }).toList();
    } catch (e) {
      debugPrint('getAllUsers hatası: $e');
      rethrow;
    }
  }

  Future<void> createUser(Map<String, dynamic> userData) async {
    try {
      // UUID oluştur
      final userId = 'user-${DateTime.now().millisecondsSinceEpoch}';
      
      await query(
        'INSERT INTO users (id, name, email, role_id, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [userId, userData['name'], userData['email'], userData['role_id'], userData['password']],
      );
      debugPrint('Kullanıcı oluşturuldu');
    } catch (e) {
      debugPrint('createUser hatası: $e');
      rethrow;
    }
  }

  Future<void> updateUser(String id, Map<String, dynamic> userData) async {
    try {
      final updateFields = <String>[];
      final values = <dynamic>[];
      
      if (userData.containsKey('name')) {
        updateFields.add('name = ?');
        values.add(userData['name']);
      }
      if (userData.containsKey('email')) {
        updateFields.add('email = ?');
        values.add(userData['email']);
      }
      if (userData.containsKey('role_id')) {
        updateFields.add('role_id = ?');
        values.add(userData['role_id']);
      }
      if (userData.containsKey('password')) {
        updateFields.add('password = ?');
        values.add(userData['password']);
      }
      
      updateFields.add('updated_at = NOW()');
      values.add(id);
      
      await query(
        'UPDATE users SET ${updateFields.join(', ')} WHERE id = ?',
        values,
      );
      debugPrint('Kullanıcı güncellendi');
    } catch (e) {
      debugPrint('updateUser hatası: $e');
      rethrow;
    }
  }

  Future<void> deleteUser(String id) async {
    try {
      await query('DELETE FROM users WHERE id = ?', [id]);
      debugPrint('Kullanıcı silindi');
    } catch (e) {
      debugPrint('deleteUser hatası: $e');
      rethrow;
    }
  }

  // Service operations
  Future<List<Map<String, dynamic>>> getAllServices() async {
    try {
      final results = await query('SELECT * FROM services ORDER BY created_at DESC');
      return results.map((row) => {
        'id': row['id'],
        'name': row['name'],
        'description': row['description'],
        'provider_id': row['provider_id'],
        'price': row['price'],
        'duration': row['duration'],
        'created_at': row['created_at'].toString(),
        'updated_at': row['updated_at'].toString(),
      }).toList();
    } catch (e) {
      debugPrint('getAllServices hatası: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getServicesByProvider(int providerId) async {
    try {
      final results = await query(
        'SELECT * FROM services WHERE provider_id = ? ORDER BY created_at DESC',
        [providerId],
      );
      return results.map((row) => {
        'id': row['id'],
        'name': row['name'],
        'description': row['description'],
        'provider_id': row['provider_id'],
        'price': row['price'],
        'duration': row['duration'],
        'created_at': row['created_at'].toString(),
        'updated_at': row['updated_at'].toString(),
      }).toList();
    } catch (e) {
      debugPrint('getServicesByProvider hatası: $e');
      rethrow;
    }
  }

  // Appointment operations
  Future<List<Map<String, dynamic>>> getAllAppointments() async {
    try {
      final results = await query('SELECT * FROM appointments ORDER BY appointment_date DESC');
      return results.map((row) => {
        'id': row['id'],
        'customer_id': row['customer_id'],
        'provider_id': row['provider_id'],
        'service_id': row['service_id'],
        'appointment_date': row['appointment_date'].toString(),
        'status': row['status'],
        'created_at': row['created_at'].toString(),
        'updated_at': row['updated_at'].toString(),
      }).toList();
    } catch (e) {
      debugPrint('getAllAppointments hatası: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getAppointmentsByCustomer(int customerId) async {
    try {
      final results = await query(
        'SELECT * FROM appointments WHERE customer_id = ? ORDER BY appointment_date DESC',
        [customerId],
      );
      return results.map((row) => {
        'id': row['id'],
        'customer_id': row['customer_id'],
        'provider_id': row['provider_id'],
        'service_id': row['service_id'],
        'appointment_date': row['appointment_date'].toString(),
        'status': row['status'],
        'created_at': row['created_at'].toString(),
        'updated_at': row['updated_at'].toString(),
      }).toList();
    } catch (e) {
      debugPrint('getAppointmentsByCustomer hatası: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getAppointmentsByProvider(int providerId) async {
    try {
      final results = await query(
        'SELECT * FROM appointments WHERE provider_id = ? ORDER BY appointment_date DESC',
        [providerId],
      );
      return results.map((row) => {
        'id': row['id'],
        'customer_id': row['customer_id'],
        'provider_id': row['provider_id'],
        'service_id': row['service_id'],
        'appointment_date': row['appointment_date'].toString(),
        'status': row['status'],
        'created_at': row['created_at'].toString(),
        'updated_at': row['updated_at'].toString(),
      }).toList();
    } catch (e) {
      debugPrint('getAppointmentsByProvider hatası: $e');
      rethrow;
    }
  }

  Future<void> createAppointment(Map<String, dynamic> appointmentData) async {
    try {
      await query(
        'INSERT INTO appointments (customer_id, provider_id, service_id, appointment_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [
          appointmentData['customer_id'],
          appointmentData['provider_id'],
          appointmentData['service_id'],
          appointmentData['appointment_date'],
          appointmentData['status'],
        ],
      );
      debugPrint('Randevu oluşturuldu');
    } catch (e) {
      debugPrint('createAppointment hatası: $e');
      rethrow;
    }
  }

  Future<void> updateAppointment(int id, Map<String, dynamic> appointmentData) async {
    try {
      await query(
        'UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?',
        [appointmentData['status'], id],
      );
      debugPrint('Randevu güncellendi');
    } catch (e) {
      debugPrint('updateAppointment hatası: $e');
      rethrow;
    }
  }

  Future<void> deleteAppointment(int id) async {
    try {
      await query('DELETE FROM appointments WHERE id = ?', [id]);
      debugPrint('Randevu silindi');
    } catch (e) {
      debugPrint('deleteAppointment hatası: $e');
      rethrow;
    }
  }

  // Role operations
  Future<List<Map<String, dynamic>>> getAllRoles() async {
    try {
      final results = await query('SELECT * FROM roles ORDER BY created_at DESC');
      return results.map((row) => {
        'id': row['id'],
        'name': row['name'],
        'description': row['description'],
        'permissions': '{}',
        'created_at': row['created_at'].toString(),
        'updated_at': row['updated_at'].toString(),
      }).toList();
    } catch (e) {
      debugPrint('getAllRoles hatası: $e');
      rethrow;
    }
  }

  // Language operations
  Future<List<Map<String, dynamic>>> getAllLanguages() async {
    try {
      final results = await query('SELECT * FROM languages WHERE is_active = 1 ORDER BY sort_order ASC');
      return results.map((row) => {
        'id': row['id'],
        'name': row['name'],
        'native_name': row['native_name'],
        'flag_emoji': row['flag_emoji'],
        'is_active': row['is_active'],
        'sort_order': row['sort_order'],
        'created_at': row['created_at'].toString(),
        'updated_at': row['updated_at'].toString(),
      }).toList();
    } catch (e) {
      debugPrint('getAllLanguages hatası: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> getLanguageById(String languageId) async {
    try {
      final results = await query(
        'SELECT * FROM languages WHERE id = ? AND is_active = 1',
        [languageId],
      );

      if (results.isNotEmpty) {
        final row = results.first;
        return {
          'id': row['id'],
          'name': row['name'],
          'native_name': row['native_name'],
          'flag_emoji': row['flag_emoji'],
          'is_active': row['is_active'],
          'sort_order': row['sort_order'],
          'created_at': row['created_at'].toString(),
          'updated_at': row['updated_at'].toString(),
        };
      }
      return null;
    } catch (e) {
      debugPrint('getLanguageById hatası: $e');
      rethrow;
    }
  }

  // Translation operations
  Future<Map<String, String>> getTranslations(String languageId) async {
    try {
      final results = await query(
        'SELECT translation_key, translation_value FROM translations WHERE language_id = ?',
        [languageId],
      );

      final translations = <String, String>{};
      for (final row in results) {
        translations[row['translation_key']] = row['translation_value'];
      }
      return translations;
    } catch (e) {
      debugPrint('getTranslations hatası: $e');
      rethrow;
    }
  }

  Future<String?> getTranslation(String languageId, String key) async {
    try {
      final results = await query(
        'SELECT translation_value FROM translations WHERE language_id = ? AND translation_key = ?',
        [languageId, key],
      );

      if (results.isNotEmpty) {
        return results.first['translation_value'];
      }
      return null;
    } catch (e) {
      debugPrint('getTranslation hatası: $e');
      rethrow;
    }
  }

  Future<Map<String, String>> getTranslationsByCategory(String languageId, String category) async {
    try {
      final results = await query(
        'SELECT translation_key, translation_value FROM translations WHERE language_id = ? AND category = ?',
        [languageId, category],
      );

      final translations = <String, String>{};
      for (final row in results) {
        translations[row['translation_key']] = row['translation_value'];
      }
      return translations;
    } catch (e) {
      debugPrint('getTranslationsByCategory hatası: $e');
      rethrow;
    }
  }

  Future<void> updateTranslation(String languageId, String key, String value) async {
    try {
      await query(
        'UPDATE translations SET translation_value = ?, updated_at = NOW() WHERE language_id = ? AND translation_key = ?',
        [value, languageId, key],
      );
      debugPrint('Çeviri güncellendi: $key');
    } catch (e) {
      debugPrint('updateTranslation hatası: $e');
      rethrow;
    }
  }
} 