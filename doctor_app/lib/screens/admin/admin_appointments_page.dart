import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/appointment_model.dart';
import '../../models/user_model.dart';
import '../../models/service_model.dart';

class AdminAppointmentsPage extends StatefulWidget {
  const AdminAppointmentsPage({super.key});

  @override
  State<AdminAppointmentsPage> createState() => _AdminAppointmentsPageState();
}

class _AdminAppointmentsPageState extends State<AdminAppointmentsPage> {
  bool _isLoading = true;
  String? _error;
  List<AppointmentModel> _appointments = [];
  Map<String, UserModel> _customers = {};
  Map<String, UserModel> _providers = {};
  Map<String, ServiceModel> _services = {};
  String _selectedStatus = 'all';
  DateTime? _selectedDate;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      Query query = FirebaseFirestore.instance.collection('appointments');

      // Durum filtresi
      if (_selectedStatus != null && _selectedStatus != 'all') {
        query = query.where('status', isEqualTo: _selectedStatus);
      }

      // Tarih filtresi
      if (_selectedDate != null) {
        final startOfDay = DateTime(_selectedDate!.year, _selectedDate!.month, _selectedDate!.day);
        final endOfDay = startOfDay.add(const Duration(days: 1));
        query = query.where('startTime', isGreaterThanOrEqualTo: startOfDay)
            .where('startTime', isLessThan: endOfDay);
      }

      final snapshot = await query.get();
      final appointments = snapshot.docs.map((doc) {
        try {
          return AppointmentModel.fromMap(doc.data() as Map<String, dynamic>);
        } catch (e) {
          print('Randevu dönüştürme hatası: $e');
          return null;
        }
      }).where((appointment) => appointment != null).cast<AppointmentModel>().toList();

      // Randevuları tarihe göre sırala
      appointments.sort((a, b) => a.startTime.compareTo(b.startTime));

      // Müşteri ve hizmet sağlayıcı bilgilerini yükle
      final customerIds = appointments.map((a) => a.customerId).toSet();
      final providerIds = appointments.map((a) => a.providerId).toSet();
      final serviceIds = appointments.map((a) => a.serviceId).toSet();

      final customers = <String, UserModel>{};
      final providers = <String, UserModel>{};
      final services = <String, ServiceModel>{};

      // Müşterileri yükle
      for (final customerId in customerIds) {
        final doc = await FirebaseFirestore.instance
            .collection('users')
            .doc(customerId)
            .get();
        if (doc.exists) {
          customers[customerId] = UserModel.fromMap(doc.data() as Map<String, dynamic>);
        }
      }

      // Hizmet sağlayıcıları yükle
      for (final providerId in providerIds) {
        final doc = await FirebaseFirestore.instance
            .collection('users')
            .doc(providerId)
            .get();
        if (doc.exists) {
          providers[providerId] = UserModel.fromMap(doc.data() as Map<String, dynamic>);
        }
      }

      // Hizmetleri yükle
      for (final serviceId in serviceIds) {
        final doc = await FirebaseFirestore.instance
            .collection('services')
            .doc(serviceId)
            .get();
        if (doc.exists) {
          services[serviceId] = ServiceModel.fromMap(doc.data() as Map<String, dynamic>);
        }
      }

      setState(() {
        _appointments = appointments;
        _customers = customers;
        _providers = providers;
        _services = services;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Randevular yüklenemedi: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _updateAppointmentStatus(String appointmentId, String newStatus) async {
    try {
      await FirebaseFirestore.instance
          .collection('appointments')
          .doc(appointmentId)
          .update({'status': newStatus});

      await _loadAppointments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Randevu durumu güncellendi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
        );
      }
    }
  }

  Future<void> _deleteAppointment(String appointmentId) async {
    try {
      await FirebaseFirestore.instance
          .collection('appointments')
          .doc(appointmentId)
          .delete();

      await _loadAppointments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Randevu silindi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
        );
      }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Randevu Yönetimi'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: DropdownButtonFormField<String>(
              value: _selectedStatus,
              decoration: const InputDecoration(
                labelText: 'Durum Filtresi',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'all', child: Text('Tümü')),
                DropdownMenuItem(value: 'pending', child: Text('Beklemede')),
                DropdownMenuItem(value: 'confirmed', child: Text('Onaylandı')),
                DropdownMenuItem(value: 'cancelled', child: Text('İptal Edildi')),
                DropdownMenuItem(value: 'completed', child: Text('Tamamlandı')),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _selectedStatus = value;
                  });
                  _loadAppointments();
                }
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: const InputDecoration(
                labelText: 'Tarih Filtresi',
                border: OutlineInputBorder(),
              ),
              onTap: () async {
                final pickedDate = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate ?? DateTime.now(),
                  firstDate: DateTime(2023),
                  lastDate: DateTime(2024),
                );
                if (pickedDate != null) {
                  setState(() {
                    _selectedDate = pickedDate;
                  });
                  _loadAppointments();
                }
              },
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : _appointments.isEmpty
                        ? const Center(child: Text('Randevu bulunamadı'))
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _appointments.length,
                            itemBuilder: (context, index) {
                              final appointment = _appointments[index];
                              final customer = _customers[appointment.customerId];
                              final provider = _providers[appointment.providerId];
                              final service = _services[appointment.serviceId];

                              return Card(
                                margin: const EdgeInsets.only(bottom: 16),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          CircleAvatar(
                                            backgroundColor: _getStatusColor(appointment.status),
                                            child: Text(
                                              _getStatusText(appointment.status)[0],
                                              style: const TextStyle(color: Colors.white),
                                            ),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  service?.name ?? 'Bilinmeyen Hizmet',
                                                  style: Theme.of(context).textTheme.titleMedium,
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  '${provider?.name ?? 'Bilinmeyen Sağlayıcı'} - ${customer?.name ?? 'Bilinmeyen Müşteri'}',
                                                  style: Theme.of(context).textTheme.bodyMedium,
                                                ),
                                              ],
                                            ),
                                          ),
                                          PopupMenuButton<String>(
                                            onSelected: (value) {
                                              if (value == 'delete') {
                                                showDialog(
                                                  context: context,
                                                  builder: (context) => AlertDialog(
                                                    title: const Text('Randevuyu Sil'),
                                                    content: const Text(
                                                      'Bu randevuyu silmek istediğinizden emin misiniz?',
                                                    ),
                                                    actions: [
                                                      TextButton(
                                                        onPressed: () {
                                                          Navigator.pop(context);
                                                        },
                                                        child: const Text('İptal'),
                                                      ),
                                                      TextButton(
                                                        onPressed: () {
                                                          Navigator.pop(context);
                                                          _deleteAppointment(appointment.id);
                                                        },
                                                        child: const Text('Sil'),
                                                      ),
                                                    ],
                                                  ),
                                                );
                                              } else {
                                                _updateAppointmentStatus(appointment.id, value);
                                              }
                                            },
                                            itemBuilder: (context) => [
                                              const PopupMenuItem(
                                                value: 'pending',
                                                child: Text('Beklemede'),
                                              ),
                                              const PopupMenuItem(
                                                value: 'confirmed',
                                                child: Text('Onayla'),
                                              ),
                                              const PopupMenuItem(
                                                value: 'cancelled',
                                                child: Text('İptal Et'),
                                              ),
                                              const PopupMenuItem(
                                                value: 'completed',
                                                child: Text('Tamamlandı'),
                                              ),
                                              const PopupMenuDivider(),
                                              const PopupMenuItem(
                                                value: 'delete',
                                                child: Text('Sil'),
                                              ),
                                            ],
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
                                            '${appointment.startTime.hour}:${appointment.startTime.minute.toString().padLeft(2, '0')} - '
                                            '${appointment.endTime.hour}:${appointment.endTime.minute.toString().padLeft(2, '0')}',
                                          ),
                                        ],
                                      ),
                                      if (appointment.notes != null) ...[
                                        const SizedBox(height: 8),
                                        Text(
                                          'Notlar: ${appointment.notes}',
                                          style: Theme.of(context).textTheme.bodySmall,
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
} 