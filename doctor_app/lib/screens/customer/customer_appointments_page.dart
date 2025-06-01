import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/appointment_model.dart';
import '../../models/service_model.dart';
import '../../models/user_model.dart';
import 'package:intl/intl.dart';

class CustomerAppointmentsPage extends StatefulWidget {
  const CustomerAppointmentsPage({super.key});

  @override
  State<CustomerAppointmentsPage> createState() => _CustomerAppointmentsPageState();
}

class _CustomerAppointmentsPageState extends State<CustomerAppointmentsPage> {
  bool _isLoading = true;
  String? _error;
  List<AppointmentModel> _appointments = [];
  Map<String, ServiceModel> _services = {};
  Map<String, UserModel> _providers = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) throw Exception('Kullanıcı bulunamadı');

      setState(() {
        _isLoading = true;
        _error = null;
      });

      final snapshot = await FirebaseFirestore.instance
          .collection('appointments')
          .where('customerId', isEqualTo: user.id)
          .orderBy('startTime', descending: true)
          .get();

      final appointments = snapshot.docs.map((doc) {
        try {
          return AppointmentModel.fromMap(doc.data() as Map<String, dynamic>);
        } catch (e) {
          print('Randevu dönüştürme hatası: $e');
          return null;
        }
      }).where((appointment) => appointment != null).cast<AppointmentModel>().toList();

      // Hizmet ve sağlayıcı bilgilerini yükle
      final serviceIds = appointments.map((a) => a.serviceId).toSet();
      final providerIds = appointments.map((a) => a.providerId).toSet();

      final services = <String, ServiceModel>{};
      final providers = <String, UserModel>{};

      for (final serviceId in serviceIds) {
        final doc = await FirebaseFirestore.instance
            .collection('services')
            .doc(serviceId)
            .get();
        if (doc.exists) {
          services[serviceId] = ServiceModel.fromMap(doc.data() as Map<String, dynamic>);
        }
      }

      for (final providerId in providerIds) {
        final doc = await FirebaseFirestore.instance
            .collection('users')
            .doc(providerId)
            .get();
        if (doc.exists) {
          providers[providerId] = UserModel.fromMap(doc.data() as Map<String, dynamic>);
        }
      }

      if (mounted) {
        setState(() {
          _appointments = appointments;
          _services = services;
          _providers = providers;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Randevular yüklenemedi: $e';
          _isLoading = false;
        });
      }
    }
  }

  bool _canCancelAppointment(AppointmentModel appointment) {
    final now = DateTime.now();
    final appointmentTime = appointment.startTime;
    final difference = appointmentTime.difference(now);
    return difference.inHours >= 1; // En az 1 saat kala iptal edilebilir
  }

  Future<void> _cancelAppointment(AppointmentModel appointment) async {
    try {
      if (!_canCancelAppointment(appointment)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Randevuya 1 saatten az kaldığı için iptal edilemez'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      final result = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Randevu İptali'),
          content: const Text('Bu randevuyu iptal etmek istediğinizden emin misiniz?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Vazgeç'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('İptal Et'),
            ),
          ],
        ),
      );

      if (result != true) return;

      await FirebaseFirestore.instance
          .collection('appointments')
          .doc(appointment.id)
          .update({
        'status': AppointmentStatus.cancelled.toString(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Randevu başarıyla iptal edildi'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Randevu iptal edilemedi: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Randevularım'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _appointments.isEmpty
                  ? const Center(child: Text('Henüz randevunuz bulunmuyor.'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _appointments.length,
                      itemBuilder: (context, index) {
                        final appointment = _appointments[index];
                        final service = _services[appointment.serviceId];
                        final provider = _providers[appointment.providerId];

                        final isUpcoming = appointment.startTime.isAfter(DateTime.now());
                        final canCancel = isUpcoming && _canCancelAppointment(appointment);

                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            service?.name ?? 'Yükleniyor...',
                                            style: Theme.of(context).textTheme.titleMedium,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            provider?.businessName ?? provider?.name ?? 'Yükleniyor...',
                                            style: Theme.of(context).textTheme.bodyMedium,
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
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
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    const Icon(Icons.calendar_today, size: 16),
                                    const SizedBox(width: 8),
                                    Text(
                                      '${appointment.startTime.day}/${appointment.startTime.month}/${appointment.startTime.year}',
                                    ),
                                    const SizedBox(width: 16),
                                    const Icon(Icons.access_time, size: 16),
                                    const SizedBox(width: 8),
                                    Text(
                                      '${appointment.startTime.hour.toString().padLeft(2, '0')}:${appointment.startTime.minute.toString().padLeft(2, '0')} - ${appointment.endTime.hour.toString().padLeft(2, '0')}:${appointment.endTime.minute.toString().padLeft(2, '0')}',
                                    ),
                                  ],
                                ),
                                if (appointment.notes?.isNotEmpty ?? false) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    'Not: ${appointment.notes}',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                                if (canCancel) ...[
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: () => _cancelAppointment(appointment),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red,
                                    ),
                                    child: const Text('Randevuyu İptal Et'),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
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