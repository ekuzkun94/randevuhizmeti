import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_page.dart';
import 'customer_profile_page.dart';
import 'create_appointment_page.dart';
import 'customer_appointments_page.dart';
import 'service_providers_page.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:doctor_app/models/appointment_model.dart';
import 'map_page.dart';
// import 'appointments_page.dart'; // Dosya yoksa veya kullanılmıyorsa yoruma al

class CustomerHomePage extends StatefulWidget {
  const CustomerHomePage({super.key});

  @override
  State<CustomerHomePage> createState() => _CustomerHomePageState();
}

class _CustomerHomePageState extends State<CustomerHomePage> {
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Müşteri Paneli'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authProvider.signOut();
              if (!context.mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginPage()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hoş Geldiniz, ${user?.name ?? ""}!',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 24),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                _buildMenuCard(
                  context,
                  Icons.calendar_today,
                  'Randevu Oluştur',
                  () async {
                    final result = await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const CreateAppointmentPage(),
                      ),
                    );
                    if (result == true && mounted) {
                      setState(() {}); // Randevuları yenile
                    }
                  },
                ),
                _buildMenuCard(
                  context,
                  Icons.history,
                  'Randevu Geçmişi',
                  () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const CustomerAppointmentsPage(),
                      ),
                    );
                  },
                ),
                _buildMenuCard(
                  context,
                  Icons.business,
                  'Hizmet Sağlayıcılar',
                  () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const ServiceProvidersPage(),
                      ),
                    );
                  },
                ),
                _buildMenuCard(
                  context,
                  Icons.person,
                  'Profil',
                  () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const CustomerProfilePage(),
                      ),
                    );
                  },
                ),
                _buildMenuCard(
                  context,
                  Icons.map,
                  'Haritada Gör',
                  () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const MapPage(),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text(
              'Yaklaşan Randevular',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildUpcomingAppointments(),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuCard(
    BuildContext context,
    IconData icon,
    String title,
    VoidCallback onTap,
  ) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 48,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUpcomingAppointments() {
    return FutureBuilder<List<AppointmentModel>>(
      future: _loadUpcomingAppointments(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text('Hata: ${snapshot.error}'));
        }

        final appointments = snapshot.data ?? [];
        if (appointments.isEmpty) {
          return const Center(child: Text('Yaklaşan randevunuz bulunmuyor.'));
        }

        return ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: appointments.length,
          itemBuilder: (context, index) {
            final appointment = appointments[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const Icon(Icons.calendar_today),
                title: Text(
                  '${appointment.startTime.day}/${appointment.startTime.month}/${appointment.startTime.year}',
                ),
                subtitle: Text(
                  '${appointment.startTime.hour.toString().padLeft(2, '0')}:${appointment.startTime.minute.toString().padLeft(2, '0')}',
                ),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(appointment.status),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getStatusText(appointment.status),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<List<AppointmentModel>> _loadUpcomingAppointments() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return [];

      final now = DateTime.now();
      final snapshot = await FirebaseFirestore.instance
          .collection('appointments')
          .where('customerId', isEqualTo: user.id)
          .where('startTime', isGreaterThanOrEqualTo: now)
          .orderBy('startTime')
          .limit(5)
          .get();

      return snapshot.docs.map((doc) {
        try {
          return AppointmentModel.fromMap(doc.data() as Map<String, dynamic>);
        } catch (e) {
          print('Randevu dönüştürme hatası: $e');
          return null;
        }
      }).where((appointment) => appointment != null).cast<AppointmentModel>().toList();
    } catch (e) {
      print('Yaklaşan randevular yüklenirken hata: $e');
      return [];
    }
  }

  Color _getStatusColor(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.pending:
        return Colors.orange;
      case AppointmentStatus.confirmed:
        return Colors.green;
      case AppointmentStatus.cancelled:
        return Colors.red;
      case AppointmentStatus.completed:
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.pending:
        return 'Beklemede';
      case AppointmentStatus.confirmed:
        return 'Onaylandı';
      case AppointmentStatus.cancelled:
        return 'İptal Edildi';
      case AppointmentStatus.completed:
        return 'Tamamlandı';
      default:
        return status.toString();
    }
  }
} 