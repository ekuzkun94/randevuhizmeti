import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/database_config.dart';

class ApiService {
  static const String baseUrl = '${DatabaseConfig.supabaseUrl}/rest/v1';

  // Kullanıcı girişi
  static Future<Map<String, dynamic>> login(
      String email, String password, String roleId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
          'role_id': roleId,
        }),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Giriş başarısız'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Kullanıcı kaydı
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    String role = 'customer',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'email': email,
          'phone': phone,
          'password': password,
          'role': role,
        }),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 201) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Kayıt başarısız'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // ==================== APPOINTMENTS ====================

  // Tüm randevuları getir
  static Future<Map<String, dynamic>> getAppointments() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/appointments'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data;
      } else {
        throw Exception('Randevular alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Yeni randevu oluştur
  static Future<Map<String, dynamic>> createAppointment({
    String? customerId,
    required String customerName,
    String? customerEmail,
    String? customerPhone,
    required String providerId,
    required String serviceId,
    required String appointmentDate, // YYYY-MM-DD
    required String appointmentTime, // HH:MM
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
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/appointments'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'customer_id': customerId,
          'customer_name': customerName,
          'customer_email': customerEmail,
          'customer_phone': customerPhone,
          'provider_id': providerId,
          'service_id': serviceId,
          'appointment_date': appointmentDate,
          'appointment_time': appointmentTime,
          'notes': notes,
          'is_guest': isGuest,
          'duration': duration,
          'location': location,
          'price': price,
          'payment_method': paymentMethod,
          'card_number': cardNumber,
          'card_holder': cardHolder,
          'expiry_date': expiryDate,
          'cvv': cvv,
        }),
      );

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Randevu oluşturulamadı');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Randevu güncelleme
  static Future<Map<String, dynamic>> updateAppointment({
    required String appointmentId,
    String? appointmentDate,
    String? appointmentTime,
    String? notes,
    String? status,
    String? location,
    double? price,
    String? paymentStatus,
  }) async {
    try {
      final Map<String, dynamic> requestBody = {};

      if (appointmentDate != null) {
        requestBody['appointment_date'] = appointmentDate;
      }
      if (appointmentTime != null) {
        requestBody['appointment_time'] = appointmentTime;
      }
      if (notes != null) requestBody['notes'] = notes;
      if (status != null) requestBody['status'] = status;
      if (location != null) requestBody['location'] = location;
      if (price != null) requestBody['price'] = price;
      if (paymentStatus != null) requestBody['payment_status'] = paymentStatus;

      final response = await http.put(
        Uri.parse('$baseUrl/appointments/$appointmentId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Randevu güncellenemedi'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Randevu silme
  static Future<Map<String, dynamic>> deleteAppointment(
      String appointmentId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/appointments/$appointmentId'),
        headers: {'Content-Type': 'application/json'},
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Randevu silinemedi'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Randevu durumunu güncelle
  static Future<Map<String, dynamic>> updateAppointmentStatus(
      String appointmentId, String status) async {
    return updateAppointment(
      appointmentId: appointmentId,
      status: status,
    );
  }

  // ==================== SERVICES ====================

  // Supabase REST API ile tüm hizmetleri getir
  static Future<List<dynamic>> getServices() async {
    final url = Uri.parse('$baseUrl/services?select=*');
    final response = await http.get(
      url,
      headers: {
        'apikey': DatabaseConfig.supabaseAnonKey,
        'Authorization': 'Bearer ${DatabaseConfig.supabaseAnonKey}',
      },
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Supabase services alınamadı: ${response.statusCode}');
    }
  }

  // Provider'a ait hizmetleri getir
  static Future<Map<String, dynamic>> getServicesByProvider(
      String providerId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/services/provider/$providerId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception(
            'Provider hizmetleri alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Yeni hizmet oluştur
  static Future<Map<String, dynamic>> createService({
    required String name,
    required String description,
    required int duration,
    required double price,
    required String providerId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/services'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'description': description,
          'duration': duration,
          'price': price,
          'provider_id': providerId,
        }),
      );

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Hizmet oluşturulamadı');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Hizmet güncelle
  static Future<Map<String, dynamic>> updateService({
    required String serviceId,
    String? name,
    String? description,
    int? duration,
    double? price,
  }) async {
    try {
      final Map<String, dynamic> requestBody = {};

      if (name != null) requestBody['name'] = name;
      if (description != null) requestBody['description'] = description;
      if (duration != null) requestBody['duration'] = duration;
      if (price != null) requestBody['price'] = price;

      final response = await http.put(
        Uri.parse('$baseUrl/services/$serviceId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Hizmet güncellenemedi'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Hizmet sil
  static Future<Map<String, dynamic>> deleteService(String serviceId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/services/$serviceId'),
        headers: {'Content-Type': 'application/json'},
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Hizmet silinemedi'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // ==================== WORKING HOURS ====================

  // Provider'ın çalışma saatlerini getir
  static Future<Map<String, dynamic>> getWorkingHours(String providerId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/working-hours/$providerId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Çalışma saatleri alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Çalışma saatleri oluştur/güncelle
  static Future<Map<String, dynamic>> updateWorkingHours({
    required String providerId,
    required List<Map<String, dynamic>> workingHours,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/working-hours/$providerId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'working_hours': workingHours,
        }),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {
          'error': responseData['error'] ?? 'Çalışma saatleri güncellenemedi'
        };
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // ==================== PROVIDERS ====================

  // Tüm provider'ları getir
  static Future<List<dynamic>> getProviders() async {
    final url = Uri.parse('$baseUrl/providers?select=*');
    final response = await http.get(
      url,
      headers: {
        'apikey': DatabaseConfig.supabaseAnonKey,
        'Authorization': 'Bearer ${DatabaseConfig.supabaseAnonKey}',
      },
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Supabase providers alınamadı: ${response.statusCode}');
    }
  }

  // Belirli provider'ı getir
  static Future<Map<String, dynamic>> getProvider(String providerId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/providers/$providerId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Provider alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Provider profili güncelle
  static Future<Map<String, dynamic>> updateProvider({
    required String providerId,
    String? businessName,
    String? description,
    String? specialization,
    int? experienceYears,
    String? phone,
    String? address,
    String? city,
    bool? isActive,
  }) async {
    try {
      final Map<String, dynamic> requestBody = {};

      if (businessName != null) requestBody['business_name'] = businessName;
      if (description != null) requestBody['description'] = description;
      if (specialization != null) {
        requestBody['specialization'] = specialization;
      }
      if (experienceYears != null) {
        requestBody['experience_years'] = experienceYears;
      }
      if (phone != null) requestBody['phone'] = phone;
      if (address != null) requestBody['address'] = address;
      if (city != null) requestBody['city'] = city;
      if (isActive != null) requestBody['is_active'] = isActive;

      final response = await http.put(
        Uri.parse('$baseUrl/providers/$providerId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Provider güncellenemedi'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // API durumunu kontrol et
  static Future<bool> checkApiStatus() async {
    try {
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {'Content-Type': 'application/json'},
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Bağlantı durumunu kontrol et (checkApiStatus ile aynı)
  static Future<Map<String, dynamic>> checkConnection() async {
    try {
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'status': 'online',
          'message': 'API bağlantısı başarılı'
        };
      } else {
        return {
          'success': false,
          'status': 'offline',
          'message': 'API erişilemez'
        };
      }
    } catch (e) {
      return {
        'success': false,
        'status': 'offline',
        'message': 'Bağlantı hatası: $e'
      };
    }
  }

  // ==================== USER PROFILE ====================

  // Kullanıcı profili güncelle
  static Future<Map<String, dynamic>> updateProfile({
    required String userId,
    String? name,
    String? email,
    String? phone,
  }) async {
    try {
      final Map<String, dynamic> requestBody = {};

      if (name != null) requestBody['name'] = name;
      if (email != null) requestBody['email'] = email;
      if (phone != null) requestBody['phone'] = phone;

      final response = await http.put(
        Uri.parse('$baseUrl/users/$userId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Profil güncellenemedi'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // ==================== SECURITY & AUTH ====================

  // Token refresh
  static Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'refresh_token': refreshToken,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Token yenilenemedi');
      }
    } catch (e) {
      throw Exception('Token refresh hatası: $e');
    }
  }

  // Çıkış yapma (logout)
  static Future<Map<String, dynamic>> logout(String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/logout'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        return {'error': errorData['error'] ?? 'Çıkış yapılamadı'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Token doğrulama
  static Future<Map<String, dynamic>> validateToken(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/validate'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        return {
          'valid': false,
          'error': errorData['error'] ?? 'Token geçersiz'
        };
      }
    } catch (e) {
      return {'valid': false, 'error': 'Token doğrulama hatası: $e'};
    }
  }

  // Authorization header'ı ekleyen generic HTTP request metodu
  static Future<http.Response> _authorizedRequest({
    required String method,
    required String endpoint,
    String? token,
    Map<String, dynamic>? body,
    Map<String, String>? additionalHeaders,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      ...?additionalHeaders,
    };

    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    final uri = Uri.parse('$baseUrl$endpoint');

    switch (method.toUpperCase()) {
      case 'GET':
        return await http.get(uri, headers: headers);
      case 'POST':
        return await http.post(uri,
            headers: headers, body: body != null ? json.encode(body) : null);
      case 'PUT':
        return await http.put(uri,
            headers: headers, body: body != null ? json.encode(body) : null);
      case 'DELETE':
        return await http.delete(uri, headers: headers);
      default:
        throw Exception('Desteklenmeyen HTTP metodu: $method');
    }
  }

  // ==================== SECURITY HELPERS ====================

  // Rate limiting kontrolü

  // IP geoblocking kontrolü (basit)
  static Future<bool> _checkGeolocation() async {
    // Production'da gerçek geolocation API'si kullanılabilir
    return true;
  }

  // Audit log

  // ==================== STAFF ====================

  // Tüm staff üyelerini getir
  static Future<List<Map<String, dynamic>>> getStaff() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/staff'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception('Staff listesi alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Provider'a ait staff üyelerini getir
  static Future<List<Map<String, dynamic>>> getStaffByProvider(
      String providerId) async {
    final url = Uri.parse(
        '${DatabaseConfig.supabaseUrl}/rest/v1/staff?provider_id=eq.$providerId&is_active=eq.true');
    final response = await http.get(
      url,
      headers: {
        'apikey': DatabaseConfig.supabaseAnonKey,
        'Authorization': 'Bearer ${DatabaseConfig.supabaseAnonKey}',
      },
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data
          .map<Map<String, dynamic>>((e) => Map<String, dynamic>.from(e))
          .toList();
    } else {
      throw Exception(
          'Supabase staff (by provider) alınamadı: ${response.statusCode}');
    }
  }

  // Staff üyesi detayını getir
  static Future<Map<String, dynamic>> getStaffById(String staffId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/staff?id=eq.$staffId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (data.isNotEmpty) {
          return data.first;
        } else {
          throw Exception('Staff üyesi bulunamadı');
        }
      } else {
        throw Exception('Staff detayı alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Yeni staff üyesi ekle
  static Future<Map<String, dynamic>> createStaff({
    required String providerId,
    String? userId,
    required String firstName,
    required String lastName,
    required String position,
    String? specialization,
    int experienceYears = 0,
    String? phone,
    String? email,
    String? bio,
    String? photoUrl,
    double rating = 0.0,
    int totalReviews = 0,
    bool isActive = true,
    bool isAvailable = true,
    Map<String, dynamic>? workingHours,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/staff'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'provider_id': providerId,
          'user_id': userId,
          'first_name': firstName,
          'last_name': lastName,
          'position': position,
          'specialization': specialization,
          'experience_years': experienceYears,
          'phone': phone,
          'email': email,
          'bio': bio,
          'photo_url': photoUrl,
          'rating': rating,
          'total_reviews': totalReviews,
          'is_active': isActive,
          'is_available': isAvailable,
          'working_hours': workingHours,
        }),
      );

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Staff üyesi oluşturulamadı');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Staff üyesi güncelle
  static Future<Map<String, dynamic>> updateStaff({
    required String staffId,
    String? firstName,
    String? lastName,
    String? position,
    String? specialization,
    int? experienceYears,
    String? phone,
    String? email,
    String? bio,
    String? photoUrl,
    double? rating,
    int? totalReviews,
    bool? isActive,
    bool? isAvailable,
    Map<String, dynamic>? workingHours,
  }) async {
    try {
      final Map<String, dynamic> requestBody = {};

      if (firstName != null) {
        requestBody['first_name'] = firstName;
      }
      if (lastName != null) {
        requestBody['last_name'] = lastName;
      }
      if (position != null) {
        requestBody['position'] = position;
      }
      if (specialization != null) {
        requestBody['specialization'] = specialization;
      }
      if (experienceYears != null) {
        requestBody['experience_years'] = experienceYears;
      }
      if (phone != null) {
        requestBody['phone'] = phone;
      }
      if (email != null) {
        requestBody['email'] = email;
      }
      if (bio != null) {
        requestBody['bio'] = bio;
      }
      if (photoUrl != null) {
        requestBody['photo_url'] = photoUrl;
      }
      if (rating != null) {
        requestBody['rating'] = rating;
      }
      if (totalReviews != null) {
        requestBody['total_reviews'] = totalReviews;
      }
      if (isActive != null) {
        requestBody['is_active'] = isActive;
      }
      if (isAvailable != null) {
        requestBody['is_available'] = isAvailable;
      }
      if (workingHours != null) {
        requestBody['working_hours'] = workingHours;
      }

      final response = await http.put(
        Uri.parse('$baseUrl/staff?id=eq.$staffId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Staff üyesi güncellenemedi'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Staff üyesi sil
  static Future<Map<String, dynamic>> deleteStaff(String staffId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/staff?id=eq.$staffId'),
        headers: {'Content-Type': 'application/json'},
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Staff üyesi silinemedi'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Staff üyesi müsaitlik durumunu güncelle
  static Future<Map<String, dynamic>> updateStaffAvailability({
    required String staffId,
    required bool isAvailable,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/staff?id=eq.$staffId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'is_available': isAvailable,
        }),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {
          'error': responseData['error'] ?? 'Müsaitlik durumu güncellenemedi'
        };
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Staff üyesi puanını güncelle
  static Future<Map<String, dynamic>> updateStaffRating({
    required String staffId,
    required double rating,
    required int totalReviews,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/staff?id=eq.$staffId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'rating': rating,
          'total_reviews': totalReviews,
        }),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {'error': responseData['error'] ?? 'Puan güncellenemedi'};
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // ==================== STAFF-SERVICES RELATIONSHIP ====================

  // Staff'ın sunduğu hizmetleri getir
  static Future<List<Map<String, dynamic>>> getStaffServices(
      String staffId) async {
    try {
      final response = await http.get(
        Uri.parse(
            '$baseUrl/staff_services?staff_id=eq.$staffId&is_active=eq.true'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception('Staff hizmetleri alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Belirli bir hizmeti sunan staff üyelerini getir
  static Future<List<Map<String, dynamic>>> getStaffByService(
      String serviceId) async {
    final url = Uri.parse(
        '${DatabaseConfig.supabaseUrl}/rest/v1/staff_services?service_id=eq.$serviceId&is_active=eq.true&select=staff(*)');
    final response = await http.get(
      url,
      headers: {
        'apikey': DatabaseConfig.supabaseAnonKey,
        'Authorization': 'Bearer ${DatabaseConfig.supabaseAnonKey}',
      },
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      // Her kayıttaki staff alanını döndür
      return data
          .map<Map<String, dynamic>>(
              (e) => Map<String, dynamic>.from(e['staff'] ?? {}))
          .where((e) => e.isNotEmpty)
          .toList();
    } else {
      throw Exception(
          'Supabase staff (by service) alınamadı: ${response.statusCode}');
    }
  }

  // Staff üyesinin sunduğu hizmetleri detaylı getir
  static Future<List<Map<String, dynamic>>> getServicesByStaff(
      String staffId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/rpc/get_services_by_staff'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'staff_id_param': staffId}),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception(
            'Staff hizmetleri detayı alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Staff-Service ilişkisi ekle
  static Future<Map<String, dynamic>> createStaffService({
    required String staffId,
    required String serviceId,
    bool isPrimary = false,
    String experienceLevel = 'intermediate',
    double priceModifier = 1.0,
    bool isActive = true,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/staff_services'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'staff_id': staffId,
          'service_id': serviceId,
          'is_primary': isPrimary,
          'experience_level': experienceLevel,
          'price_modifier': priceModifier,
          'is_active': isActive,
        }),
      );

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(
            errorData['error'] ?? 'Staff-Service ilişkisi oluşturulamadı');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Staff-Service ilişkisi güncelle
  static Future<Map<String, dynamic>> updateStaffService({
    required String staffServiceId,
    bool? isPrimary,
    String? experienceLevel,
    double? priceModifier,
    bool? isActive,
  }) async {
    try {
      final Map<String, dynamic> requestBody = {};

      if (isPrimary != null) {
        requestBody['is_primary'] = isPrimary;
      }
      if (experienceLevel != null) {
        requestBody['experience_level'] = experienceLevel;
      }
      if (priceModifier != null) {
        requestBody['price_modifier'] = priceModifier;
      }
      if (isActive != null) {
        requestBody['is_active'] = isActive;
      }

      final response = await http.put(
        Uri.parse('$baseUrl/staff_services?id=eq.$staffServiceId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {
          'error':
              responseData['error'] ?? 'Staff-Service ilişkisi güncellenemedi'
        };
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Staff-Service ilişkisi sil
  static Future<Map<String, dynamic>> deleteStaffService(
      String staffServiceId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/staff_services?id=eq.$staffServiceId'),
        headers: {'Content-Type': 'application/json'},
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData;
      } else {
        return {
          'error': responseData['error'] ?? 'Staff-Service ilişkisi silinemedi'
        };
      }
    } catch (e) {
      return {'error': 'Bağlantı hatası: $e'};
    }
  }

  // Staff ile birlikte hizmetlerini getir (view kullanarak)
  static Future<List<Map<String, dynamic>>> getStaffWithServices() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/staff_with_services'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception(
            'Staff ve hizmetleri alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Belirli bir provider'ın staff'ını hizmetleriyle birlikte getir
  static Future<List<Map<String, dynamic>>> getStaffWithServicesByProvider(
      String providerId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/staff_with_services?provider_id=eq.$providerId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception(
            'Provider staff ve hizmetleri alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }

  // Bir servise ait provider'ları getir (junction tablosu üzerinden)
  static Future<List<Map<String, dynamic>>> getProvidersByService(
      String serviceId) async {
    final url = Uri.parse(
        '${DatabaseConfig.supabaseUrl}/rest/v1/service_providers?service_id=eq.$serviceId&is_active=eq.true&select=providers(*)');
    final response = await http.get(
      url,
      headers: {
        'apikey': DatabaseConfig.supabaseAnonKey,
        'Authorization': 'Bearer ${DatabaseConfig.supabaseAnonKey}',
      },
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      // Her kayıttaki providers alanını döndür
      return data
          .map<Map<String, dynamic>>(
              (e) => Map<String, dynamic>.from(e['providers'] ?? {}))
          .where((e) => e.isNotEmpty)
          .toList();
    } else {
      throw Exception(
          'Supabase providers (by service) alınamadı: ${response.statusCode}');
    }
  }

  // Provider ve servise göre staff'ı getir (hem provider hem de servis filtresi)
  static Future<List<Map<String, dynamic>>> getStaffByProviderAndService(
      String providerId, String serviceId) async {
    final url = Uri.parse(
        '${DatabaseConfig.supabaseUrl}/rest/v1/staff_services?service_id=eq.$serviceId&is_active=eq.true&select=staff(*)');
    final response = await http.get(
      url,
      headers: {
        'apikey': DatabaseConfig.supabaseAnonKey,
        'Authorization': 'Bearer ${DatabaseConfig.supabaseAnonKey}',
      },
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      // Her kayıttaki staff alanını döndür ve provider_id'ye göre filtrele
      final allStaff = data
          .map<Map<String, dynamic>>(
              (e) => Map<String, dynamic>.from(e['staff'] ?? {}))
          .where((e) => e.isNotEmpty)
          .toList();
      return allStaff
          .where((staff) => staff['provider_id'] == providerId)
          .toList();
    } else {
      throw Exception(
          'Supabase staff (by provider and service) alınamadı: ${response.statusCode}');
    }
  }
}
