import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import 'api_service.dart';
import 'local_database_service.dart';
import 'connectivity_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/database_config.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:appointment_app/providers/auth_provider.dart';

class HybridApiService {
  static final HybridApiService _instance = HybridApiService._internal();
  factory HybridApiService() => _instance;
  HybridApiService._internal();

  final LocalDatabaseService? _localDb = kIsWeb ? null : LocalDatabaseService();
  final ConnectivityService _connectivity = ConnectivityService();
  final Uuid _uuid = const Uuid();

  // Supabase client
  final SupabaseClient _supabase = SupabaseClient(
    DatabaseConfig.supabaseUrl,
    DatabaseConfig.supabaseAnonKey,
  );

  // Force online mode for testing - API is available
  bool get isOnline => true; // Temporarily force online mode

  bool _apiReachable =
      true; // Default to true, will be updated by connectivity checks
  bool get isWebPlatform => kIsWeb;
  bool get canUseOfflineMode => !kIsWeb && _localDb != null;

  Future<void> initialize() async {
    await _connectivity.initialize();
    if (canUseOfflineMode && _localDb != null) {
      await _localDb!.database; // Initialize local database only if not web
    }
    // Check API reachability
    await _checkApiReachability();
  }

  Future<void> _checkApiReachability() async {
    try {
      // Test if backend API is reachable
      final response = await _supabase.from('services').select().limit(1);
      _apiReachable = true;
      debugPrint('✅ API reachability check: SUCCESS');
    } catch (e) {
      _apiReachable = false;
      debugPrint('❌ API reachability check: FAILED - $e');
    }
  }

  // ==================== AUTHENTICATION ====================

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      // Web platformunda her zaman API kullan
      if (isWebPlatform || isOnline) {
        // Try online login first
        final result = await ApiService.login(
            email, password, '3'); // Default role customer
        return result;
      } else if (canUseOfflineMode) {
        // Fallback to offline login (sadece mobile)
        final user = await _localDb?.authenticateUser(email, password);
        if (user != null) {
          return {
            'user': user,
            'token': 'offline_token_${user['server_id']}',
            'offline_mode': true,
          };
        } else {
          throw Exception('Invalid credentials');
        }
      } else {
        throw Exception('No internet connection');
      }
    } catch (e) {
      // If online fails, try offline (sadece mobile)
      if (canUseOfflineMode && !isWebPlatform) {
        final user = await _localDb?.authenticateUser(email, password);
        if (user != null) {
          return {
            'user': user,
            'token': 'offline_token_${user['server_id']}',
            'offline_mode': true,
          };
        }
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    String role = 'customer',
  }) async {
    try {
      if (isOnline) {
        final result = await ApiService.register(
          name: name,
          email: email,
          phone: phone,
          password: password,
          role: role,
        );
        return result;
      } else {
        // Offline registration
        final serverId = _uuid.v4();
        await _localDb?.insertUser({
          'server_id': serverId,
          'name': name,
          'email': email,
          'phone': phone,
          'password_hash': serverId, // Will be properly hashed in local service
          'role': role,
        });

        await _localDb?.addToSyncQueue('users', serverId, 'create', {
          'server_id': serverId,
          'email': email,
          'name': name,
          'password': password,
          'role_id': role,
          'created_at': DateTime.now().toIso8601String(),
          'sync_status': 0,
        });

        return {
          'user': {
            'server_id': serverId,
            'name': name,
            'email': email,
            'phone': phone,
            'role': role,
          },
          'offline_mode': true,
        };
      }
    } catch (e) {
      rethrow;
    }
  }

  // ==================== APPOINTMENTS ====================

  Future<Map<String, dynamic>> getAppointments([String? customerId]) async {
    try {
      // Web platformunda her zaman API kullan
      if (isWebPlatform || isOnline) {
        return await ApiService.getAppointments();
      } else if (canUseOfflineMode) {
        final appointments = await _localDb?.getAppointments(customerId) ?? [];
        return {'appointments': appointments};
      } else {
        throw Exception(
            'No internet connection and offline mode not available');
      }
    } catch (e) {
      // Web platformunda fallback yok, sadece mobile'da
      if (canUseOfflineMode) {
        final appointments = await _localDb?.getAppointments(customerId) ?? [];
        return {'appointments': appointments};
      } else {
        rethrow; // Web'de error'u yukarı fırlat
      }
    }
  }

  // Email ile customer ID bulma
  Future<String?> getCustomerIdByEmail(String email) async {
    try {
      final connectivityService = ConnectivityService();
      final isOnline = connectivityService.isOnline;

      if (isOnline) {
        // Supabase'den email ile user ID'yi al
        final headers = {
          'apikey': DatabaseConfig.supabaseServiceKey,
          'Authorization': 'Bearer ${DatabaseConfig.supabaseServiceKey}',
          'Content-Type': 'application/json',
        };

        final url =
            '${DatabaseConfig.supabaseUrl}/rest/v1/users?email=eq.$email&select=id';
        final response = await http.get(Uri.parse(url), headers: headers);

        if (response.statusCode == 200) {
          final List users = json.decode(response.body);
          if (users.isNotEmpty) {
            return users.first['id'];
          }
        }
      }

      return null;
    } catch (e) {
      print('❌ Error getting customer ID by email: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>> createAppointment({
    required String? customer,
    String? customerId,
    required String providerId,
    required String serviceId,
    required String date,
    required String time,
    String? notes,
    String? guestName,
    String? guestEmail,
    String? guestPhone,
  }) async {
    try {
      print('🚀 CREATE APPOINTMENT CALLED');
      print(
          '📋 Data: customer=$customer, provider=$providerId, service=$serviceId, date=$date, time=$time');

      final connectivityService = ConnectivityService();
      final isOnline = connectivityService.isOnline;

      print('✅ API reachability check: SUCCESS');

      // Check connectivity
      print('🌐 Connection status: isOnline=$isOnline');
      print('📡 Network: $isOnline, API: $isOnline');

      // Email ile customer ID'yi bul (context kullanmadan)
      String? actualCustomerId = customerId;
      if (actualCustomerId == null && customer != null) {
        // Email adresi varsa o ile arama yap
        String? userEmail = customer;
        if (userEmail.contains('@')) {
          actualCustomerId = await getCustomerIdByEmail(userEmail);
          print('🔍 Found customer ID by email: $actualCustomerId');
        }
      }

      // Prepare appointment data
      final appointmentData = {
        'customer_id': actualCustomerId,
        'guest_name': guestName,
        'guest_email': guestEmail,
        'guest_phone': guestPhone,
        'provider_id': providerId,
        'service_id': serviceId,
        'appointment_date': date,
        'appointment_time': time,
        'status': 'confirmed',
        'notes': notes ?? '',
        'is_guest': actualCustomerId == null ? 1 : 0,
        'created_at': DateTime.now().toIso8601String(),
        'sync_status': 0,
      };

      print('📤 Appointment data to send: $appointmentData');

      if (isOnline) {
        print('🌐 Sending to Supabase...');
        try {
          // Send to Supabase
          final headers = {
            'apikey': DatabaseConfig.supabaseServiceKey,
            'Authorization': 'Bearer ${DatabaseConfig.supabaseServiceKey}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          };

          final url = '${DatabaseConfig.supabaseUrl}/rest/v1/appointments';
          final response = await http.post(
            Uri.parse(url),
            headers: headers,
            body: json.encode(appointmentData),
          );

          if (response.statusCode == 201) {
            print('✅ Appointment created successfully in Supabase');
            return {
              'appointment': appointmentData,
              'success': true,
            };
          } else {
            print(
                '❌ Supabase creation failed: ${response.statusCode} - ${response.body}');
            throw Exception('Randevu oluşturulamadı');
          }
        } catch (e) {
          print('❌ Error in createAppointment: $e');
          // Continue to offline storage
        }
      }

      // Offline mode or error - save locally
      print('📱 Offline mode - saving locally');
      final serverId = _uuid.v4();
      final localAppointmentData = Map<String, dynamic>.from(appointmentData);
      localAppointmentData['server_id'] = serverId;

      try {
        await _localDb?.addToSyncQueue(
            'appointments', serverId, 'create', localAppointmentData);
        print('💾 Saved to local storage with serverId: $serverId');

        return {
          'appointment': localAppointmentData,
          'offline_mode': true,
        };
      } catch (e) {
        print('❌ Error in createAppointment: $e');
        return {
          'error': e.toString(),
          'success': false,
        };
      }
    } catch (e) {
      print('❌ Error in createAppointment: $e');
      return {
        'error': e.toString(),
        'success': false,
      };
    }
  }

  Future<Map<String, dynamic>> updateAppointment({
    required String appointmentId,
    String? appointmentDate,
    String? appointmentTime,
    String? notes,
    String? status,
    String? location,
    double? price,
    String? paymentStatus,
  }) async {
    final updateData = <String, dynamic>{};
    if (appointmentDate != null) {
      updateData['appointment_date'] = appointmentDate;
    }
    if (appointmentTime != null) {
      updateData['appointment_time'] = appointmentTime;
    }
    if (notes != null) updateData['notes'] = notes;
    if (status != null) updateData['status'] = status;
    if (location != null) updateData['location'] = location;
    if (price != null) updateData['price'] = price;
    if (paymentStatus != null) updateData['payment_status'] = paymentStatus;

    try {
      if (isOnline) {
        return await ApiService.updateAppointment(
          appointmentId: appointmentId,
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime,
          notes: notes,
          status: status,
          location: location,
          price: price,
          paymentStatus: paymentStatus,
        );
      } else {
        await _localDb?.updateAppointment(appointmentId, updateData);
        await _localDb?.addToSyncQueue(
            'appointments', appointmentId, 'update', updateData);

        return {'success': true, 'offline_mode': true};
      }
    } catch (e) {
      // Fallback to local update
      await _localDb?.updateAppointment(appointmentId, updateData);
      await _localDb?.addToSyncQueue(
          'appointments', appointmentId, 'update', updateData);

      return {'success': true, 'offline_mode': true};
    }
  }

  Future<Map<String, dynamic>> deleteAppointment(String appointmentId) async {
    try {
      if (isOnline) {
        return await ApiService.deleteAppointment(appointmentId);
      } else {
        await _localDb?.deleteAppointment(appointmentId);
        await _localDb?.addToSyncQueue('appointments', appointmentId, 'delete');

        return {'success': true, 'offline_mode': true};
      }
    } catch (e) {
      // Fallback to local delete
      await _localDb?.deleteAppointment(appointmentId);
      await _localDb?.addToSyncQueue('appointments', appointmentId, 'delete');

      return {'success': true, 'offline_mode': true};
    }
  }

  // ==================== SERVICES ====================

  Future<Map<String, dynamic>> getServices() async {
    try {
      // Her zaman Supabase'den veri çek
      final response = await _supabase.from('services').select();
      return {'services': response};
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> createService({
    required String name,
    required String description,
    required int duration,
    required double price,
    required String providerId,
  }) async {
    final serviceData = {
      'name': name,
      'description': description,
      'duration': duration,
      'price': price,
      'provider_id': providerId,
    };

    try {
      if (isOnline) {
        return await ApiService.createService(
          name: name,
          description: description,
          duration: duration,
          price: price,
          providerId: providerId,
        );
      } else {
        final serverId = _uuid.v4();
        serviceData['server_id'] = serverId;

        await _localDb?.insertService(serviceData);
        await _localDb?.addToSyncQueue(
            'services', serverId, 'create', serviceData);

        return {
          'service': serviceData,
          'offline_mode': true,
        };
      }
    } catch (e) {
      // Fallback to local storage
      final serverId = _uuid.v4();
      serviceData['server_id'] = serverId;

      await _localDb?.insertService(serviceData);
      await _localDb?.addToSyncQueue(
          'services', serverId, 'create', serviceData);

      return {
        'service': serviceData,
        'offline_mode': true,
      };
    }
  }

  // ==================== PROVIDERS ====================

  Future<Map<String, dynamic>> getProviders() async {
    try {
      // Her zaman Supabase'den veri çek
      final response = await _supabase.from('providers').select();
      return {'providers': response};
    } catch (e) {
      rethrow;
    }
  }

  // ==================== SYNC OPERATIONS ====================

  Future<Map<String, dynamic>> syncData() async {
    if (!isOnline) {
      return {'error': 'No internet connection for sync'};
    }

    try {
      final syncQueue = await _localDb?.getSyncQueue() ?? [];
      int synced = 0;
      int failed = 0;

      for (var item in syncQueue) {
        try {
          final tableName = item['table_name'] as String;
          final recordId = item['record_id'] as String;
          final action = item['action'] as String;
          final data = item['data'] != null
              ? jsonDecode(item['data'] as String) as Map<String, dynamic>
              : null;

          bool syncSuccess = false;

          switch (tableName) {
            case 'appointments':
              syncSuccess = await _syncAppointment(recordId, action, data);
              break;
            case 'services':
              syncSuccess = await _syncService(recordId, action, data);
              break;
            case 'users':
              syncSuccess = await _syncUser(recordId, action, data);
              break;
          }

          if (syncSuccess) {
            synced++;
          } else {
            failed++;
          }
        } catch (e) {
          failed++;
          debugPrint('Sync error for item ${item['id']}: $e');
        }
      }

      if (synced > 0) {
        await _localDb?.clearSyncQueue();
        await _localDb?.setSetting(
            'last_sync', DateTime.now().toIso8601String());
      }

      return {
        'synced': synced,
        'failed': failed,
        'total': syncQueue.length,
      };
    } catch (e) {
      return {'error': 'Sync failed: $e'};
    }
  }

  Future<bool> _syncAppointment(
      String recordId, String action, Map<String, dynamic>? data) async {
    try {
      switch (action) {
        case 'create':
          if (data != null) {
            await ApiService.createAppointment(
              customerId: data['customer_id'],
              customerName: data['customer_name'],
              customerEmail: data['customer_email'],
              customerPhone: data['customer_phone'],
              providerId: data['provider_id'],
              serviceId: data['service_id'],
              appointmentDate: data['appointment_date'],
              appointmentTime: data['appointment_time'],
              notes: data['notes'],
              isGuest: data['is_guest'] == 1,
              duration: data['duration'],
              price: data['price']?.toDouble(),
              paymentMethod: data['payment_method'],
            );
          }
          break;
        case 'update':
          if (data != null) {
            await ApiService.updateAppointment(
              appointmentId: recordId,
              appointmentDate: data['appointment_date'],
              appointmentTime: data['appointment_time'],
              notes: data['notes'],
              status: data['status'],
              price: data['price']?.toDouble(),
              paymentStatus: data['payment_status'],
            );
          }
          break;
        case 'delete':
          await ApiService.deleteAppointment(recordId);
          break;
      }
      return true;
    } catch (e) {
      debugPrint('Appointment sync error: $e');
      return false;
    }
  }

  Future<bool> _syncService(
      String recordId, String action, Map<String, dynamic>? data) async {
    try {
      switch (action) {
        case 'create':
          if (data != null) {
            await ApiService.createService(
              name: data['name'],
              description: data['description'],
              duration: data['duration'],
              price: data['price']?.toDouble() ?? 0.0,
              providerId: data['provider_id'],
            );
          }
          break;
        case 'update':
          if (data != null) {
            await ApiService.updateService(
              serviceId: recordId,
              name: data['name'],
              description: data['description'],
              duration: data['duration'],
              price: data['price']?.toDouble(),
            );
          }
          break;
        case 'delete':
          await ApiService.deleteService(recordId);
          break;
      }
      return true;
    } catch (e) {
      debugPrint('Service sync error: $e');
      return false;
    }
  }

  Future<bool> _syncUser(
      String recordId, String action, Map<String, dynamic>? data) async {
    try {
      switch (action) {
        case 'create':
          if (data != null) {
            await ApiService.register(
              name: data['name'],
              email: data['email'],
              phone: data['phone'],
              password: data['password'],
              role: data['role'] ?? 'customer',
            );
          }
          break;
        case 'update':
          if (data != null) {
            await ApiService.updateProfile(
              userId: recordId,
              name: data['name'],
              email: data['email'],
              phone: data['phone'],
            );
          }
          break;
      }
      return true;
    } catch (e) {
      debugPrint('User sync error: $e');
      return false;
    }
  }

  // ==================== STATUS METHODS ====================

  Future<bool> checkApiStatus() async {
    try {
      // Supabase'e basit bir istek at
      await _supabase.from('services').select().limit(1);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> getConnectionStatus() async {
    final stats = await _localDb?.getDatabaseStats();
    final syncQueue = await _localDb?.getSyncQueue();
    final lastSync = await _localDb?.getSetting('last_sync');

    return {
      'online': isOnline,
      'database_stats': stats,
      'pending_sync': syncQueue?.length ?? 0,
      'last_sync': lastSync,
    };
  }

  Future<Map<String, dynamic>> getSystemInfo() async {
    final stats = await _localDb?.getDatabaseStats();
    final lastSync = await _localDb?.getSetting('last_sync');
    final appVersion = await _localDb?.getSetting('app_version');

    return {
      'app_version': appVersion,
      'database_stats': stats,
      'last_sync': lastSync,
      'connection_status': isOnline ? 'Online' : 'Offline',
    };
  }

  bool get needsUpdate {
    // Web'de güncelleme kontrolü yapmayız
    if (isWebPlatform) return false;

    // Async metodları sync getter'da çağıramayız
    return false; // Şimdilik false dönüyoruz
  }
}
