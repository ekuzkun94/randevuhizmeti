import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:appointment_app/services/hybrid_api_service.dart';
import 'package:go_router/go_router.dart';

class GuestBookingPage extends StatefulWidget {
  const GuestBookingPage({super.key});

  @override
  State<GuestBookingPage> createState() => _GuestBookingPageState();
}

class _GuestBookingPageState extends State<GuestBookingPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();

  bool _isLoading = false;
  bool _isLoadingServices = false;
  bool _isLoadingProviders = false;
  bool _isApiOnline = false;

  List<Map<String, dynamic>> _allServices = [];
  List<Map<String, dynamic>> _allProviders = [];
  List<Map<String, dynamic>> _existingAppointments = [];
  String? _selectedService;
  String? _selectedProvider;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String? _selectedTime;

  final List<String> _timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ];

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _initializeData() async {
    await _checkApiStatus();
    await _loadServices();
    await _loadProviders();
    await _loadExistingAppointments();
  }

  Future<void> _checkApiStatus() async {
    try {
      final hybridApi = HybridApiService();
      final isOnline = await hybridApi.checkApiStatus();
      setState(() {
        _isApiOnline = isOnline;
      });
    } catch (e) {
      setState(() {
        _isApiOnline = false;
      });
    }
  }

  Future<void> _loadServices() async {
    setState(() => _isLoadingServices = true);

    try {
      final hybridApi = HybridApiService();
      final response = await hybridApi.getServices();
      final services = response['services'] as List<dynamic>? ?? [];

      setState(() {
        _allServices = services.map<Map<String, dynamic>>((service) {
          final serviceMap = service as Map<String, dynamic>;
          return {
            'id': serviceMap['server_id']?.toString() ?? serviceMap['id']?.toString() ?? '',
            'name': serviceMap['name'] ?? 'Bilinmeyen Hizmet',
            'description': serviceMap['description'] ?? '',
            'duration': '${serviceMap['duration'] ?? 30} dk',
            'price': '${serviceMap['price'] ?? 0} ₺',
            'provider_id': serviceMap['provider_id'] ?? '',
          };
        }).toList();
      });
    } catch (e) {
      print('Hizmetler yüklenirken hata: $e');
    } finally {
      setState(() => _isLoadingServices = false);
    }
  }

  Future<void> _loadProviders() async {
    setState(() => _isLoadingProviders = true);

    try {
      final hybridApi = HybridApiService();
      final response = await hybridApi.getProviders();
      final providers = response['providers'] as List<dynamic>? ?? [];

      setState(() {
        _allProviders = providers.map<Map<String, dynamic>>((provider) {
          final providerMap = provider as Map<String, dynamic>;
          return {
            'id': providerMap['server_id']?.toString() ?? providerMap['id']?.toString() ?? '',
            'name': providerMap['user_name'] ?? 'Bilinmeyen Provider',
            'business_name': providerMap['business_name'] ?? '',
            'specialization': providerMap['specialization'] ?? '',
            'phone': providerMap['phone'] ?? '',
            'address': providerMap['address'] ?? '',
          };
        }).toList();
      });
    } catch (e) {
      print('Providers yüklenirken hata: $e');
    } finally {
      setState(() => _isLoadingProviders = false);
    }
  }

  List<Map<String, dynamic>> get _availableProviders {
    if (_selectedService == null) return _allProviders;

    final selectedServiceData = _allServices.firstWhere(
      (service) => service['id'] == _selectedService,
      orElse: () => <String, dynamic>{},
    );

    if (selectedServiceData.isEmpty) return _allProviders;

    final serviceProviderId = selectedServiceData['provider_id']?.toString() ?? '';
    if (serviceProviderId.isNotEmpty) {
      return _allProviders.where((provider) =>
        provider['id'] == serviceProviderId).toList();
    }

    return _allProviders;
  }

  Future<void> _loadExistingAppointments() async {
    try {
      final hybridApi = HybridApiService();
      final response = await hybridApi.getAppointments();
      if (response.containsKey('appointments')) {
        final appointments = response['appointments'] as List<dynamic>? ?? [];
        setState(() {
          _existingAppointments = appointments.cast<Map<String, dynamic>>();
        });
      }
    } catch (e) {
      print('Randevular yüklenirken hata: $e');
    }
  }

  bool _isTimeSlotOccupied(String timeSlot) {
    if (_selectedProvider == null) return false;
    
    return _existingAppointments.any((appointment) {
      return appointment['appointment_date'] == DateFormat('yyyy-MM-dd').format(_selectedDate) &&
             appointment['appointment_time'] == timeSlot &&
             appointment['provider_id'] == _selectedProvider;
    });
  }

  Future<void> _createGuestAppointment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedService == null || _selectedProvider == null || _selectedTime == null) {
      _showErrorSnackBar('Lütfen tüm alanları doldurunuz');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final hybridApi = HybridApiService();
      final result = await hybridApi.createAppointment(
        customerName: _nameController.text.trim(),
        customerEmail: _emailController.text.trim(),
        customerPhone: _phoneController.text.trim(),
        providerId: _selectedProvider!,
        serviceId: _selectedService!,
        appointmentDate: DateFormat('yyyy-MM-dd').format(_selectedDate),
        appointmentTime: _selectedTime!,
        notes: _notesController.text.trim(),
        isGuest: true,
      );

      // Backend 201 status code ile başarılı response döndürürse ApiService exception fırlatmaz
      // Eğer buraya geldiyse randevu başarıyla oluşturulmuştur
      _showSuccessDialog();
    } catch (e) {
      _showErrorSnackBar('Hata: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Success animation
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.green.shade100,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: Colors.green,
                size: 50,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Başarılı!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Misafir randevunuz başarıyla oluşturuldu.',
              style: TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.email_outlined, color: Colors.blue.shade600, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Randevu detayları e-mail adresinize gönderilecektir.',
                      style: TextStyle(
                        color: Colors.blue.shade700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context); // Dialog'u kapat
                  context.go('/'); // Ana sayfaya git
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF667eea),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Ana Sayfaya Dön',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Hızlı Randevu'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF667eea), Color(0xFF764ba2)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildWelcomeCard(),
              const SizedBox(height: 20),
              _buildPersonalInfoSection(),
              const SizedBox(height: 20),
              _buildServiceSection(),
              const SizedBox(height: 20),
              if (_selectedService != null) ...[
                _buildProviderSection(),
                const SizedBox(height: 20),
              ],
              if (_selectedProvider != null) ...[
                _buildDateTimeSection(),
                const SizedBox(height: 20),
              ],
              if (_selectedTime != null) ...[
                _buildNotesSection(),
                const SizedBox(height: 30),
                _buildCreateButton(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Column(
        children: [
          Icon(Icons.flash_on, size: 48, color: Colors.white),
          SizedBox(height: 12),
          Text(
            'Hızlı Randevu',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Kayıt olmadan hızlı randevu alın',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white70,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPersonalInfoSection() {
    return _buildSectionCard(
      title: 'Kişisel Bilgiler',
      icon: Icons.person,
      child: Column(
        children: [
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Ad Soyad',
              prefixIcon: Icon(Icons.person_outline),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Ad soyad gerekli';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(
              labelText: 'E-mail',
              prefixIcon: Icon(Icons.email_outlined),
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'E-mail gerekli';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                return 'Geçerli bir e-mail adresi giriniz';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _phoneController,
            decoration: const InputDecoration(
              labelText: 'Telefon',
              prefixIcon: Icon(Icons.phone_outlined),
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Telefon numarası gerekli';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildServiceSection() {
    return _buildSectionCard(
      title: 'Hizmet Seçimi',
      icon: Icons.medical_services,
      child: _isLoadingServices
          ? Container(
              height: 60,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 12),
                    Text('Hizmetler yükleniyor...'),
                  ],
                ),
              ),
            )
          : DropdownButtonFormField<String>(
              value: _selectedService,
              decoration: const InputDecoration(
                labelText: 'Hizmet',
                prefixIcon: Icon(Icons.medical_services),
                border: OutlineInputBorder(),
              ),
                             items: _allServices.map((service) {
                 return DropdownMenuItem<String>(
                   value: service['id'],
                   child: Text(
                     '${service['name']} - ${service['price']}₺',
                     style: const TextStyle(fontSize: 14),
                     overflow: TextOverflow.ellipsis,
                   ),
                 );
               }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedService = value;
                  _selectedProvider = null;
                  _selectedTime = null;
                });
              },
              validator: (value) {
                if (value == null) {
                  return 'Lütfen bir hizmet seçiniz';
                }
                return null;
              },
            ),
    );
  }

  Widget _buildProviderSection() {
    return _buildSectionCard(
      title: 'Sağlayıcı Seçimi',
      icon: Icons.person_pin,
      child: _isLoadingProviders
          ? Container(
              height: 60,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 12),
                    Text('Sağlayıcılar yükleniyor...'),
                  ],
                ),
              ),
            )
          : DropdownButtonFormField<String>(
              value: _selectedProvider,
              decoration: const InputDecoration(
                labelText: 'Sağlayıcı',
                prefixIcon: Icon(Icons.person_pin),
                border: OutlineInputBorder(),
              ),
                             items: _availableProviders.map((provider) {
                 return DropdownMenuItem<String>(
                   value: provider['id'],
                   child: Text(
                     '${provider['name']} - ${provider['business_name']}',
                     style: const TextStyle(fontSize: 14),
                     overflow: TextOverflow.ellipsis,
                   ),
                 );
               }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedProvider = value;
                  _selectedTime = null;
                });
              },
              validator: (value) {
                if (value == null) {
                  return 'Lütfen bir sağlayıcı seçiniz';
                }
                return null;
              },
            ),
    );
  }

  Widget _buildDateTimeSection() {
    return _buildSectionCard(
      title: 'Tarih ve Saat',
      icon: Icons.calendar_today,
      child: Column(
        children: [
          // Calendar
          TableCalendar<Map<String, dynamic>>(
            firstDay: DateTime.now(),
            lastDay: DateTime.now().add(const Duration(days: 90)),
            focusedDay: _selectedDate,
            selectedDayPredicate: (day) => isSameDay(_selectedDate, day),
                         onDaySelected: (selectedDay, focusedDay) {
               setState(() {
                 _selectedDate = selectedDay;
                 _selectedTime = null;
               });
               _loadExistingAppointments(); // Yeni tarih için randevuları yükle
             },
            calendarFormat: CalendarFormat.month,
            headerStyle: const HeaderStyle(
              formatButtonVisible: false,
              titleCentered: true,
            ),
            calendarStyle: const CalendarStyle(
              outsideDaysVisible: false,
              weekendTextStyle: TextStyle(color: Colors.red),
              holidayTextStyle: TextStyle(color: Colors.red),
            ),
          ),
          const SizedBox(height: 16),
          // Time slots
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Saat Seçimi:',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
                    const SizedBox(height: 8),
          // Bilgi kartı
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(Icons.info_outline, size: 16, color: Colors.blue.shade700),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '🟢 Müsait • 🔴 Dolu • ⭐ Önerilen saat',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue.shade700,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Wrap(
             spacing: 8,
             runSpacing: 8,
             children: _timeSlots.map((time) {
               final isSelected = _selectedTime == time;
               final isOccupied = _isTimeSlotOccupied(time);
               final isPastTime = _selectedDate.isAtSameMomentAs(DateTime.now()) && 
                                  DateTime.now().hour >= int.parse(time.split(':')[0]);
               
               Color backgroundColor;
               Color borderColor;
               Color textColor;
               bool isEnabled = !isOccupied && !isPastTime;
               
               if (isSelected) {
                 backgroundColor = const Color(0xFF667eea);
                 borderColor = const Color(0xFF667eea);
                 textColor = Colors.white;
               } else if (isOccupied) {
                 backgroundColor = Colors.red.shade100;
                 borderColor = Colors.red;
                 textColor = Colors.red.shade700;
               } else if (isPastTime) {
                 backgroundColor = Colors.grey.shade200;
                 borderColor = Colors.grey.shade400;
                 textColor = Colors.grey.shade600;
               } else {
                 backgroundColor = Colors.green.shade50;
                 borderColor = Colors.green;
                 textColor = Colors.green.shade700;
               }
               
               return GestureDetector(
                 onTap: isEnabled ? () {
                   setState(() {
                     _selectedTime = time;
                   });
                 } : null,
                 child: Container(
                   padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                   decoration: BoxDecoration(
                     color: backgroundColor,
                     borderRadius: BorderRadius.circular(20),
                     border: Border.all(color: borderColor),
                   ),
                   child: Row(
                     mainAxisSize: MainAxisSize.min,
                     children: [
                       if (isOccupied) ...[
                         Icon(Icons.close, size: 16, color: textColor),
                         const SizedBox(width: 4),
                       ] else if (!isPastTime && !isSelected) ...[
                         Icon(Icons.check, size: 16, color: textColor),
                         const SizedBox(width: 4),
                       ],
                       Text(
                         time,
                         style: TextStyle(
                           color: textColor,
                           fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                         ),
                       ),
                     ],
                   ),
                 ),
               );
             }).toList(),
           ),
        ],
      ),
    );
  }

  Widget _buildNotesSection() {
    return _buildSectionCard(
      title: 'Notlar (Opsiyonel)',
      icon: Icons.note_outlined,
      child: TextFormField(
        controller: _notesController,
        decoration: const InputDecoration(
          labelText: 'Notlarınız',
          prefixIcon: Icon(Icons.note_outlined),
          border: OutlineInputBorder(),
          alignLabelWithHint: true,
        ),
        maxLines: 3,
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF667eea).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: const Color(0xFF667eea)),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildCreateButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _createGuestAppointment,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF667eea),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 8,
        ),
        child: _isLoading
            ? const CircularProgressIndicator(color: Colors.white)
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.calendar_month, size: 24),
                  SizedBox(width: 12),
                  Text(
                    'Randevu Oluştur',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
} 