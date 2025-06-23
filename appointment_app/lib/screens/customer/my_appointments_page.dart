import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../providers/language_provider.dart';

class MyAppointmentsPage extends StatefulWidget {
  const MyAppointmentsPage({super.key});

  @override
  State<MyAppointmentsPage> createState() => _MyAppointmentsPageState();
}

class _MyAppointmentsPageState extends State<MyAppointmentsPage> {
  List<Map<String, dynamic>> _appointments = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';
  bool _isApiOnline = false;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() => _isLoading = true);

    try {
      // Check API status first
      final response = await ApiService.checkConnection();
      final isOnline = response['success'] == true;
      setState(() => _isApiOnline = isOnline);

      if (isOnline) {
        final appointmentsResponse = await ApiService.getAppointments();
        if (appointmentsResponse.containsKey('appointments')) {
          final appointmentsList = appointmentsResponse['appointments'] as List<dynamic>? ?? [];
          setState(() {
            _appointments = appointmentsList.map<Map<String, dynamic>>((appointment) {
              final appointmentMap = appointment as Map<String, dynamic>;
              try {
                final appointmentDate = appointmentMap['appointment_date']?.toString() ?? '';
                final appointmentTime = appointmentMap['appointment_time']?.toString() ?? '00:00';
                final combinedDateTime = appointmentDate.isNotEmpty 
                    ? DateTime.parse('$appointmentDate $appointmentTime')
                    : DateTime.now();
                
                return {
                  'id': appointmentMap['id']?.toString() ?? '',
                  'serviceName': appointmentMap['service_name']?.toString() ?? 
                               appointmentMap['title']?.toString() ?? 'Bilinmeyen Hizmet',
                  'providerName': appointmentMap['provider_name']?.toString() ?? 'Bilinmeyen Sağlayıcı',
                  'venueName': appointmentMap['venue_name']?.toString() ?? 
                              appointmentMap['location']?.toString() ?? 'Bilinmeyen Mekan',
                  'date': combinedDateTime,
                  'time': appointmentTime,
                  'status': appointmentMap['status']?.toString() ?? 'pending',
                  'notes': appointmentMap['notes']?.toString() ?? '',
                  'price': '${appointmentMap['price'] ?? 0} ₺',
                  'duration': '${appointmentMap['duration'] ?? 30} dk',
                };
              } catch (e) {
                print('Error parsing appointment: $e');
                return {
                  'id': appointmentMap['id']?.toString() ?? '',
                  'serviceName': 'Bilinmeyen Hizmet',
                  'providerName': 'Bilinmeyen Sağlayıcı',
                  'venueName': 'Bilinmeyen Mekan',
                  'date': DateTime.now(),
                  'time': '00:00',
                  'status': 'pending',
                  'notes': '',
                  'price': '0 ₺',
                  'duration': '30 dk',
                };
              }
            }).toList();
          });
        }
      } else {
        // Offline mode - demo data
        setState(() {
          _appointments = [
            {
              'id': '1',
              'serviceName': 'Demo Randevu',
              'providerName': 'Demo Sağlayıcı',
              'venueName': 'Demo Mekan',
              'date': DateTime.now().add(const Duration(days: 1)),
              'time': '10:00',
              'status': 'confirmed',
              'notes': 'API bağlantısı olmadığı için demo veri',
              'price': '0 ₺',
              'duration': '30 dk',
            },
          ];
        });
      }
    } catch (e) {
      print('Randevular yüklenemedi: $e');
      setState(() => _appointments = []);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filteredAppointments {
    if (_selectedFilter == 'all') return _appointments;
    return _appointments.where((appointment) => appointment['status'] == _selectedFilter).toList();
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'confirmed':
        return 'Onaylandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bilinmeyen';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.green;
      case 'completed':
        return Colors.blue;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.schedule;
      case 'confirmed':
        return Icons.check_circle;
      case 'completed':
        return Icons.task_alt;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  Future<void> _cancelAppointment(String appointmentId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Randevu İptali'),
        content: const Text('Bu randevuyu iptal etmek istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Vazgeç'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('İptal Et'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);

      try {
        if (_isApiOnline) {
          await ApiService.updateAppointment(
            appointmentId: appointmentId,
            status: 'cancelled',
          );
        }

        setState(() {
          final index = _appointments.indexWhere((app) => app['id'] == appointmentId);
          if (index != -1) {
            _appointments[index]['status'] = 'cancelled';
          }
          _isLoading = false;
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
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Hata: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Future<void> _editAppointment(Map<String, dynamic> appointment) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _EditAppointmentDialog(appointment: appointment),
    );

    if (result != null) {
      setState(() => _isLoading = true);

      try {
        if (_isApiOnline) {
          await ApiService.updateAppointment(
            appointmentId: appointment['id'],
            notes: result['notes'],
          );
        }

        setState(() {
          final index = _appointments.indexWhere((app) => app['id'] == appointment['id']);
          if (index != -1) {
            if (result.containsKey('serviceName')) {
              _appointments[index]['serviceName'] = result['serviceName'];
            }
            _appointments[index]['notes'] = result['notes'];
            if (result.containsKey('dateTime')) {
              _appointments[index]['date'] = result['dateTime'];
              _appointments[index]['time'] = DateFormat.Hm().format(result['dateTime']);
            }
          }
          _isLoading = false;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Randevu başarıyla güncellendi'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Hata: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Future<void> _deleteAppointment(String appointmentId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Randevu Silme'),
        content: const Text('Bu randevuyu kalıcı olarak silmek istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Vazgeç'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Sil'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);

      try {
        if (_isApiOnline) {
          await ApiService.deleteAppointment(appointmentId);
        }

        setState(() {
          _appointments.removeWhere((app) => app['id'] == appointmentId);
          _isLoading = false;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Randevu başarıyla silindi'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Hata: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _showAppointmentDetails(Map<String, dynamic> appointment) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Title
              const Text(
                'Randevu Detayları',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF667eea),
                ),
              ),
              const SizedBox(height: 20),

              // Details
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildDetailRow('Hizmet', appointment['serviceName']),
                      _buildDetailRow('Hizmet Sağlayıcı', appointment['providerName']),
                      if (appointment['venueName'] != null)
                        _buildDetailRow('Hizmet Yeri', appointment['venueName']),
                      _buildDetailRow('Tarih', DateFormat('dd MMMM yyyy', 'tr').format(appointment['date'])),
                      _buildDetailRow('Saat', appointment['time']),
                      _buildDetailRow('Süre', appointment['duration']),
                      _buildDetailRow('Ücret', appointment['price']),
                      _buildDetailRow('Durum', _getStatusText(appointment['status'])),
                      if (appointment['notes'].isNotEmpty)
                        _buildDetailRow('Notlar', appointment['notes']),
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

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab(String filter, String title) {
    final isSelected = _selectedFilter == filter;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedFilter = filter),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? const Color(0xFF667eea) : Colors.white,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: Text(languageProvider.translate('my_appointments', fallback: 'Randevularım')),
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
            elevation: 0,
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _isLoading ? null : _loadAppointments,
                tooltip: 'Yenile',
              ),
            ],
          ),
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF667eea),
                  Color(0xFF764ba2),
                ],
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  // API Status Indicator
                  Container(
                    margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _isApiOnline ? Colors.green.shade50 : Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _isApiOnline ? Colors.green : Colors.red,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _isApiOnline ? Icons.check_circle : Icons.error,
                          color: _isApiOnline ? Colors.green : Colors.red,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _isApiOnline 
                                ? 'API Bağlantısı Aktif - Gerçek Veriler'
                                : 'API Offline - Demo Veriler',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: _isApiOnline ? Colors.green.shade700 : Colors.red.shade700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Filter Tabs
                  Container(
                    margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        _buildFilterTab('all', 'Tümü'),
                        _buildFilterTab('pending', 'Bekliyor'),
                        _buildFilterTab('confirmed', 'Onaylı'),
                        _buildFilterTab('completed', 'Tamamlandı'),
                        _buildFilterTab('cancelled', 'İptal'),
                      ],
                    ),
                  ),

                  // Appointments List
                  Expanded(
                    child: _isLoading
                        ? const Center(
                            child: CircularProgressIndicator(color: Colors.white),
                          )
                        : _filteredAppointments.isEmpty
                            ? Center(
                                child: Card(
                                  margin: const EdgeInsets.all(24),
                                  child: Padding(
                                    padding: const EdgeInsets.all(32),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.event_busy,
                                          size: 64,
                                          color: Colors.grey.shade400,
                                        ),
                                        const SizedBox(height: 16),
                                        Text(
                                          'Randevu bulunamadı',
                                          style: TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w500,
                                            color: Colors.grey.shade600,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'Henüz hiç randevunuz yok',
                                          style: TextStyle(
                                            color: Colors.grey.shade500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                itemCount: _filteredAppointments.length,
                                itemBuilder: (context, index) {
                                  final appointment = _filteredAppointments[index];
                                  return _buildAppointmentCard(appointment);
                                },
                              ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAppointmentCard(Map<String, dynamic> appointment) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _showAppointmentDetails(appointment),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  Expanded(
                    child: Text(
                      appointment['serviceName'],
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF667eea),
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(appointment['status']).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _getStatusIcon(appointment['status']),
                          size: 14,
                          color: _getStatusColor(appointment['status']),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _getStatusText(appointment['status']),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _getStatusColor(appointment['status']),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Provider and venue
              Row(
                children: [
                  const Icon(Icons.person, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      appointment['providerName'],
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Date and time
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat('dd MMM yyyy', 'tr').format(appointment['date']),
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(width: 16),
                  const Icon(Icons.access_time, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text(
                    appointment['time'],
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Duration and price
              Row(
                children: [
                  const Icon(Icons.timer, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text(
                    appointment['duration'],
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(width: 16),
                  const Icon(Icons.attach_money, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text(
                    appointment['price'],
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ],
              ),

              // Notes
              if (appointment['notes'].isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.note, size: 16, color: Colors.grey),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        appointment['notes'],
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),

              // Action buttons
              Row(
                children: [
                  if (appointment['status'] == 'pending' || appointment['status'] == 'confirmed') ...[
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _editAppointment(appointment),
                        icon: const Icon(Icons.edit, size: 16),
                        label: const Text('Düzenle'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF667eea),
                          side: const BorderSide(color: Color(0xFF667eea)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _cancelAppointment(appointment['id']),
                        icon: const Icon(Icons.cancel, size: 16),
                        label: const Text('İptal Et'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ] else if (appointment['status'] == 'cancelled') ...[
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _deleteAppointment(appointment['id']),
                        icon: const Icon(Icons.delete, size: 16),
                        label: const Text('Sil'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red.shade700,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ] else ...[
                    Expanded(
                      child: Text(
                        'Randevu ${_getStatusText(appointment['status']).toLowerCase()}',
                        style: TextStyle(
                          color: _getStatusColor(appointment['status']),
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EditAppointmentDialog extends StatefulWidget {
  final Map<String, dynamic> appointment;

  const _EditAppointmentDialog({required this.appointment});

  @override
  State<_EditAppointmentDialog> createState() => __EditAppointmentDialogState();
}

class __EditAppointmentDialogState extends State<_EditAppointmentDialog> {
  late final TextEditingController _notesController;

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController(text: widget.appointment['notes']);
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Randevu Düzenle'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextFormField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: 'Notlar',
              border: OutlineInputBorder(),
            ),
            maxLines: 3,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('İptal'),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop({
              'notes': _notesController.text,
            });
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
          ),
          child: const Text('Kaydet'),
        ),
      ],
    );
  }
}