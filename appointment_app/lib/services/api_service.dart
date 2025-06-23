import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:5001';

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

      if (appointmentDate != null)
        requestBody['appointment_date'] = appointmentDate;
      if (appointmentTime != null)
        requestBody['appointment_time'] = appointmentTime;
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

  // Tüm hizmetleri getir
  static Future<Map<String, dynamic>> getServices() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/services'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Hizmetler alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
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
  static Future<Map<String, dynamic>> getProviders() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/providers'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Provider\'lar alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
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
      if (specialization != null)
        requestBody['specialization'] = specialization;
      if (experienceYears != null)
        requestBody['experience_years'] = experienceYears;
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
  static final Map<String, DateTime> _lastRequestTimes = {};
  static const Duration _minRequestInterval = Duration(milliseconds: 100);

  static bool _canMakeRequest(String endpoint) {
    final now = DateTime.now();
    if (_lastRequestTimes.containsKey(endpoint)) {
      final lastRequest = _lastRequestTimes[endpoint]!;
      if (now.difference(lastRequest) < _minRequestInterval) {
        return false;
      }
    }
    _lastRequestTimes[endpoint] = now;
    return true;
  }

  // IP geoblocking kontrolü (basit)
  static Future<bool> _checkGeolocation() async {
    // Production'da gerçek geolocation API'si kullanılabilir
    return true;
  }

  // Audit log
  static void _logSecurityEvent(String event, Map<String, dynamic> details) {
    print('[SECURITY] $event: ${json.encode(details)}');
    // Production'da bu logs bir güvenlik sistemine gönderilebilir
  }
}
