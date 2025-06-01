import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AdminDemoPage extends StatefulWidget {
  const AdminDemoPage({super.key});

  @override
  State<AdminDemoPage> createState() => _AdminDemoPageState();
}

class _AdminDemoPageState extends State<AdminDemoPage> {
  bool _isLoading = false;
  String? _result;

  Future<void> addSampleData() async {
    setState(() {
      _isLoading = true;
      _result = null;
    });
    try {
      // 1. Hizmet Sağlayıcılar
      final List<Map<String, dynamic>> providers = [
        {
          'id': 'provider1',
          'name': 'Dr. Ahmet Yılmaz',
          'email': 'ahmet@demo.com',
          'phone': '5551112233',
          'role': 'serviceProvider',
          'businessName': 'Yılmaz Diş Kliniği',
          'address': 'Kadıköy, İstanbul',
          'taxNumber': '1234567890',
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'provider2',
          'name': 'Dr. Ayşe Demir',
          'email': 'ayse@demo.com',
          'phone': '5552223344',
          'role': 'serviceProvider',
          'businessName': 'Demir Estetik Kliniği',
          'address': 'Beşiktaş, İstanbul',
          'taxNumber': '2345678901',
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'provider3',
          'name': 'Dr. Mehmet Kaya',
          'email': 'mehmet@demo.com',
          'phone': '5553334455',
          'role': 'serviceProvider',
          'businessName': 'Kaya Sağlık Merkezi',
          'address': 'Üsküdar, İstanbul',
          'taxNumber': '3456789012',
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        }
      ];

      // Hizmet sağlayıcıları ekle
      for (var provider in providers) {
        await FirebaseFirestore.instance
            .collection('users')
            .doc(provider['id'] as String)
            .set(provider);
      }

      // 2. Hizmetler
      final List<Map<String, dynamic>> services = [
        {
          'id': 'service1',
          'providerId': 'provider1',
          'name': 'Diş Temizliği',
          'description': 'Profesyonel diş temizliği hizmeti.',
          'price': 500,
          'duration': 30,
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'service2',
          'providerId': 'provider1',
          'name': 'Diş Dolgusu',
          'description': 'Kaviteli dişler için dolgu işlemi.',
          'price': 800,
          'duration': 45,
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'service3',
          'providerId': 'provider2',
          'name': 'Botoks',
          'description': 'Yüz bölgesi botoks uygulaması.',
          'price': 2000,
          'duration': 60,
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'service4',
          'providerId': 'provider2',
          'name': 'Dolgu',
          'description': 'Yüz bölgesi dolgu uygulaması.',
          'price': 3000,
          'duration': 90,
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'service5',
          'providerId': 'provider3',
          'name': 'Genel Muayene',
          'description': 'Genel sağlık kontrolü.',
          'price': 400,
          'duration': 30,
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'service6',
          'providerId': 'provider3',
          'name': 'Aşılama',
          'description': 'Grip aşısı uygulaması.',
          'price': 300,
          'duration': 15,
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        }
      ];

      // Hizmetleri ekle
      for (var service in services) {
        await FirebaseFirestore.instance
            .collection('services')
            .doc(service['id'] as String)
            .set(service);
      }

      // 3. Çalışma Saatleri
      final List<Map<String, dynamic>> workingHours = [
        // Dr. Ahmet Yılmaz'ın çalışma saatleri
        {
          'id': 'wh1',
          'providerId': 'provider1',
          'dayOfWeek': 1, // Pazartesi
          'startTime': '09:00',
          'endTime': '17:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'wh2',
          'providerId': 'provider1',
          'dayOfWeek': 2, // Salı
          'startTime': '09:00',
          'endTime': '17:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'wh3',
          'providerId': 'provider1',
          'dayOfWeek': 3, // Çarşamba
          'startTime': '09:00',
          'endTime': '17:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'wh10',
          'providerId': 'provider1',
          'dayOfWeek': 6, // Cumartesi
          'startTime': '09:00',
          'endTime': '14:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        // Dr. Ayşe Demir'in çalışma saatleri
        {
          'id': 'wh4',
          'providerId': 'provider2',
          'dayOfWeek': 2, // Salı
          'startTime': '10:00',
          'endTime': '18:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'wh5',
          'providerId': 'provider2',
          'dayOfWeek': 3, // Çarşamba
          'startTime': '10:00',
          'endTime': '18:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'wh6',
          'providerId': 'provider2',
          'dayOfWeek': 4, // Perşembe
          'startTime': '10:00',
          'endTime': '18:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        // Dr. Mehmet Kaya'nın çalışma saatleri
        {
          'id': 'wh7',
          'providerId': 'provider3',
          'dayOfWeek': 1, // Pazartesi
          'startTime': '08:00',
          'endTime': '16:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'wh8',
          'providerId': 'provider3',
          'dayOfWeek': 4, // Perşembe
          'startTime': '08:00',
          'endTime': '16:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        {
          'id': 'wh9',
          'providerId': 'provider3',
          'dayOfWeek': 5, // Cuma
          'startTime': '08:00',
          'endTime': '16:00',
          'isActive': true,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        }
      ];

      // Çalışma saatlerini ekle
      for (var wh in workingHours) {
        await FirebaseFirestore.instance
            .collection('working_hours')
            .doc(wh['id'] as String)
            .set(wh);
      }

      setState(() {
        _result = 'Örnek veriler başarıyla eklendi!';
      });
    } catch (e) {
      setState(() {
        _result = 'Hata: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Demo Veri Ekle'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_isLoading)
                const CircularProgressIndicator()
              else
                ElevatedButton(
                  onPressed: addSampleData,
                  child: const Text('Demo Veri Ekle'),
                ),
              if (_result != null)
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    _result!,
                    style: TextStyle(
                      color: _result!.contains('Hata') ? Colors.red : Colors.green,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
} 