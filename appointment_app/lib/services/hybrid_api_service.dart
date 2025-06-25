import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import 'api_service.dart';
import 'local_database_service.dart';
import 'connectivity_service.dart';

class HybridApiService {
  static final HybridApiService _instance = HybridApiService._internal();
  factory HybridApiService() => _instance;
  HybridApiService._internal();

  final LocalDatabaseService? _localDb = kIsWeb ? null : LocalDatabaseService();
  final ConnectivityService _connectivity = ConnectivityService();
  final Uuid _uuid = const Uuid();

  bool get isOnline => _connectivity.isOnline;
  bool get isWebPlatform => kIsWeb;
  bool get canUseOfflineMode => !kIsWeb && _localDb != null;

  Future<void> initialize() async {
    await _connectivity.initialize();
    if (canUseOfflineMode) {
      await _localDb!.database; // Initialize local database only if not web
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
        final user = await _localDb!.authenticateUser(email, password);
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
        final user = await _localDb!.authenticateUser(email, password);
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
        await _localDb!.insertUser({
          'server_id': serverId,
          'name': name,
          'email': email,
          'phone': phone,
          'password_hash': serverId, // Will be properly hashed in local service
          'role': role,
        });

        await _localDb!.addToSyncQueue('users', serverId, 'create', {
          'name': name,
          'email': email,
          'phone': phone,
          'password': password,
          'role': role,
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
        final appointments = await _localDb!.getAppointments(customerId);
        return {'appointments': appointments};
      } else {
        throw Exception(
            'No internet connection and offline mode not available');
      }
    } catch (e) {
      // Web platformunda fallback yok, sadece mobile'da
      if (canUseOfflineMode) {
        final appointments = await _localDb!.getAppointments(customerId);
        return {'appointments': appointments};
      } else {
        rethrow; // Web'de error'u yukarı fırlat
      }
    }
  }

  Future<Map<String, dynamic>> createAppointment({
    String? customerId,
    required String customerName,
    String? customerEmail,
    String? customerPhone,
    required String providerId,
    required String serviceId,
    required String appointmentDate,
    required String appointmentTime,
    String? notes,
    bool isGuest = false,
    int? duration,
    String? location,
    double? price,
    String? paymentMethod,
    String? cardNumber,
    String? cardHolder,
    String? expiryDate,
    String? cvv,
  }) async {
    final appointmentData = {
      'customer_id': customerId,
      'customer_name': customerName,
      'customer_email': customerEmail,
      'customer_phone': customerPhone,
      'provider_id': providerId,
      'service_id': serviceId,
      'appointment_date': appointmentDate,
      'appointment_time': appointmentTime,
      'notes': notes,
      'duration': duration ?? 30,
      'price': price ?? 0.0,
      'payment_method': paymentMethod ?? 'cash_on_service',
      'payment_status': paymentMethod == 'online_payment' ? 'paid' : 'pending',
      'is_guest': isGuest ? 1 : 0,
      'status': 'confirmed',
    };

    try {
      if (isOnline) {
        return await ApiService.createAppointment(
          customerId: customerId,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          providerId: providerId,
          serviceId: serviceId,
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime,
          notes: notes,
          isGuest: isGuest,
          duration: duration,
          location: location,
          price: price,
          paymentMethod: paymentMethod,
          cardNumber: cardNumber,
          cardHolder: cardHolder,
          expiryDate: expiryDate,
          cvv: cvv,
        );
      } else {
        // Offline appointment creation
        final serverId = _uuid.v4();
        appointmentData['server_id'] = serverId;

        await _localDb!.insertAppointment(appointmentData);
        await _localDb!.addToSyncQueue(
            'appointments', serverId, 'create', appointmentData);

        return {
          'appointment': appointmentData,
          'offline_mode': true,
        };
      }
    } catch (e) {
      // Fallback to local storage
      final serverId = _uuid.v4();
      appointmentData['server_id'] = serverId;

      await _localDb!.insertAppointment(appointmentData);
      await _localDb!
          .addToSyncQueue('appointments', serverId, 'create', appointmentData);

      return {
        'appointment': appointmentData,
        'offline_mode': true,
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
        await _localDb!.updateAppointment(appointmentId, updateData);
        await _localDb!.addToSyncQueue(
            'appointments', appointmentId, 'update', updateData);

        return {'success': true, 'offline_mode': true};
      }
    } catch (e) {
      // Fallback to local update
      await _localDb!.updateAppointment(appointmentId, updateData);
      await _localDb!
          .addToSyncQueue('appointments', appointmentId, 'update', updateData);

      return {'success': true, 'offline_mode': true};
    }
  }

  Future<Map<String, dynamic>> deleteAppointment(String appointmentId) async {
    try {
      if (isOnline) {
        return await ApiService.deleteAppointment(appointmentId);
      } else {
        await _localDb!.deleteAppointment(appointmentId);
        await _localDb!.addToSyncQueue('appointments', appointmentId, 'delete');

        return {'success': true, 'offline_mode': true};
      }
    } catch (e) {
      // Fallback to local delete
      await _localDb!.deleteAppointment(appointmentId);
      await _localDb!.addToSyncQueue('appointments', appointmentId, 'delete');

      return {'success': true, 'offline_mode': true};
    }
  }

  // ==================== SERVICES ====================

  Future<Map<String, dynamic>> getServices() async {
    try {
      // Web platformunda her zaman API kullan
      if (isWebPlatform || isOnline) {
        return await ApiService.getServices();
      } else if (canUseOfflineMode) {
        final services = await _localDb!.getServices();
        return {'services': services};
      } else {
        throw Exception(
            'No internet connection and offline mode not available');
      }
    } catch (e) {
      // Web platformunda fallback yok, sadece mobile'da
      if (canUseOfflineMode) {
        final services = await _localDb!.getServices();
        return {'services': services};
      } else {
        rethrow; // Web'de error'u yukarı fırlat
      }
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

        await _localDb!.insertService(serviceData);
        await _localDb!
            .addToSyncQueue('services', serverId, 'create', serviceData);

        return {
          'service': serviceData,
          'offline_mode': true,
        };
      }
    } catch (e) {
      // Fallback to local storage
      final serverId = _uuid.v4();
      serviceData['server_id'] = serverId;

      await _localDb!.insertService(serviceData);
      await _localDb!
          .addToSyncQueue('services', serverId, 'create', serviceData);

      return {
        'service': serviceData,
        'offline_mode': true,
      };
    }
  }

  // ==================== PROVIDERS ====================

  Future<Map<String, dynamic>> getProviders() async {
    try {
      // Web platformunda her zaman API kullan
      if (isWebPlatform || isOnline) {
        return await ApiService.getProviders();
      } else if (canUseOfflineMode) {
        final providers = await _localDb!.getProviders();
        return {'providers': providers};
      } else {
        throw Exception(
            'No internet connection and offline mode not available');
      }
    } catch (e) {
      // Web platformunda fallback yok, sadece mobile'da
      if (canUseOfflineMode) {
        final providers = await _localDb!.getProviders();
        return {'providers': providers};
      } else {
        rethrow; // Web'de error'u yukarı fırlat
      }
    }
  }

  // ==================== SYNC OPERATIONS ====================

  Future<Map<String, dynamic>> syncData() async {
    if (!isOnline) {
      return {'error': 'No internet connection for sync'};
    }

    try {
      final syncQueue = await _localDb!.getSyncQueue();
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
        await _localDb!.clearSyncQueue();
        await _localDb!
            .setSetting('last_sync', DateTime.now().toIso8601String());
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
      return await ApiService.checkApiStatus();
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> getConnectionStatus() async {
    final stats = await _localDb!.getDatabaseStats();
    final syncQueue = await _localDb!.getSyncQueue();
    final lastSync = await _localDb!.getSetting('last_sync');

    return {
      'online': isOnline,
      'database_stats': stats,
      'pending_sync': syncQueue.length,
      'last_sync': lastSync,
    };
  }

  Future<Map<String, dynamic>> getSystemInfo() async {
    final stats = await _localDb!.getDatabaseStats();
    final lastSync = await _localDb!.getSetting('last_sync');
    final appVersion = await _localDb!.getSetting('app_version');

    return {
      'app_version': appVersion,
      'database_stats': stats,
      'last_sync': lastSync,
      'connection_status': isOnline ? 'Online' : 'Offline',
    };
  }
}
