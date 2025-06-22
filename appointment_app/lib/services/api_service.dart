import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://127.0.0.1:5001';
  
  // Tüm randevuları getir
  static Future<List<Map<String, dynamic>>> getAppointments() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/appointments'),
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception('Randevular alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }
  
  // Yeni randevu oluştur
  static Future<Map<String, dynamic>> createAppointment({
    required String title,
    required String description,
    required DateTime dateTime,
    required String userName,
    String? providerName,
    String? venueName,
    String? serviceName,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/appointments'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'title': title,
          'description': description,
          'date_time': dateTime.toIso8601String(),
          'user_name': userName,
          'provider_name': providerName,
          'venue_name': venueName,
          'service_name': serviceName,
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
  
  // Randevu önerisi al
  static Future<List<String>> getAppointmentSuggestions({
    required Map<String, dynamic> preferences,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/appointments/suggest'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'preferences': preferences}),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<String>.from(data['suggestions']);
      } else {
        throw Exception('Öneriler alınamadı: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }
  
  // Randevu güncelle
  static Future<Map<String, dynamic>> updateAppointment({
    required int appointmentId,
    String? title,
    String? description,
    DateTime? dateTime,
    String? status,
  }) async {
    try {
      final Map<String, dynamic> updateData = {};
      
      if (title != null) updateData['title'] = title;
      if (description != null) updateData['description'] = description;
      if (dateTime != null) updateData['date_time'] = dateTime.toIso8601String();
      if (status != null) updateData['status'] = status;
      
      final response = await http.put(
        Uri.parse('$baseUrl/appointments/$appointmentId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(updateData),
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Randevu güncellenemedi');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }
  
  // Randevu sil/iptal et
  static Future<Map<String, dynamic>> deleteAppointment(int appointmentId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/appointments/$appointmentId'),
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Randevu silinemedi');
      }
    } catch (e) {
      throw Exception('Bağlantı hatası: $e');
    }
  }
  
  // Randevu durumunu güncelle (iptal et)
  static Future<Map<String, dynamic>> cancelAppointment(int appointmentId) async {
    return updateAppointment(
      appointmentId: appointmentId,
      status: 'cancelled',
    );
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
} 