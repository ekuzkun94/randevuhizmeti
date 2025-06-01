import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AdminSettingsPage extends StatefulWidget {
  const AdminSettingsPage({super.key});

  @override
  State<AdminSettingsPage> createState() => _AdminSettingsPageState();
}

class _AdminSettingsPageState extends State<AdminSettingsPage> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic> _settings = {};
  final _formKey = GlobalKey<FormState>();

  final _appointmentIntervalController = TextEditingController();
  final _maxAppointmentsPerDayController = TextEditingController();
  final _minAppointmentNoticeController = TextEditingController();
  final _maxAppointmentNoticeController = TextEditingController();
  final _cancellationNoticeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  @override
  void dispose() {
    _appointmentIntervalController.dispose();
    _maxAppointmentsPerDayController.dispose();
    _minAppointmentNoticeController.dispose();
    _maxAppointmentNoticeController.dispose();
    _cancellationNoticeController.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final doc = await FirebaseFirestore.instance
          .collection('settings')
          .doc('appointment_settings')
          .get();

      if (doc.exists) {
        _settings = doc.data()!;
        _appointmentIntervalController.text = _settings['appointmentInterval']?.toString() ?? '30';
        _maxAppointmentsPerDayController.text = _settings['maxAppointmentsPerDay']?.toString() ?? '8';
        _minAppointmentNoticeController.text = _settings['minAppointmentNotice']?.toString() ?? '1';
        _maxAppointmentNoticeController.text = _settings['maxAppointmentNotice']?.toString() ?? '30';
        _cancellationNoticeController.text = _settings['cancellationNotice']?.toString() ?? '24';
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Ayarlar yüklenemedi: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _saveSettings() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final settings = {
        'appointmentInterval': int.parse(_appointmentIntervalController.text),
        'maxAppointmentsPerDay': int.parse(_maxAppointmentsPerDayController.text),
        'minAppointmentNotice': int.parse(_minAppointmentNoticeController.text),
        'maxAppointmentNotice': int.parse(_maxAppointmentNoticeController.text),
        'cancellationNotice': int.parse(_cancellationNoticeController.text),
      };

      await FirebaseFirestore.instance
          .collection('settings')
          .doc('appointment_settings')
          .set(settings);

      setState(() {
        _settings = settings;
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ayarlar kaydedildi')),
        );
      }
    } catch (e) {
      setState(() {
        _error = 'Ayarlar kaydedilemedi: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sistem Ayarları'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Randevu Ayarları',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: _appointmentIntervalController,
                                  decoration: const InputDecoration(
                                    labelText: 'Randevu Aralığı (dakika)',
                                    border: OutlineInputBorder(),
                                  ),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Bu alan zorunludur';
                                    }
                                    final number = int.tryParse(value);
                                    if (number == null || number <= 0) {
                                      return 'Geçerli bir sayı girin';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: _maxAppointmentsPerDayController,
                                  decoration: const InputDecoration(
                                    labelText: 'Günlük Maksimum Randevu Sayısı',
                                    border: OutlineInputBorder(),
                                  ),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Bu alan zorunludur';
                                    }
                                    final number = int.tryParse(value);
                                    if (number == null || number <= 0) {
                                      return 'Geçerli bir sayı girin';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: _minAppointmentNoticeController,
                                  decoration: const InputDecoration(
                                    labelText: 'Minimum Randevu Bildirimi (saat)',
                                    border: OutlineInputBorder(),
                                  ),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Bu alan zorunludur';
                                    }
                                    final number = int.tryParse(value);
                                    if (number == null || number < 0) {
                                      return 'Geçerli bir sayı girin';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: _maxAppointmentNoticeController,
                                  decoration: const InputDecoration(
                                    labelText: 'Maksimum Randevu Bildirimi (gün)',
                                    border: OutlineInputBorder(),
                                  ),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Bu alan zorunludur';
                                    }
                                    final number = int.tryParse(value);
                                    if (number == null || number <= 0) {
                                      return 'Geçerli bir sayı girin';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: _cancellationNoticeController,
                                  decoration: const InputDecoration(
                                    labelText: 'İptal Bildirimi (saat)',
                                    border: OutlineInputBorder(),
                                  ),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Bu alan zorunludur';
                                    }
                                    final number = int.tryParse(value);
                                    if (number == null || number < 0) {
                                      return 'Geçerli bir sayı girin';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 24),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: _saveSettings,
                                    child: const Text('Ayarları Kaydet'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
} 