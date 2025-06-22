import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:appointment_app/providers/language_provider.dart';
import 'package:appointment_app/services/api_service.dart';
import 'package:intl/intl.dart';

class CreateAppointmentPage extends StatefulWidget {
  final String? preSelectedProviderId;
  final String? preSelectedProviderName;
  final String? preSelectedServiceCategory;

  const CreateAppointmentPage({
    super.key,
    this.preSelectedProviderId,
    this.preSelectedProviderName,
    this.preSelectedServiceCategory,
  });

  @override
  State<CreateAppointmentPage> createState() => _CreateAppointmentPageState();
}

class _CreateAppointmentPageState extends State<CreateAppointmentPage> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _userNameController = TextEditingController();
  final _searchController = TextEditingController();
  final _providerSearchController = TextEditingController();
  
  DateTime _selectedDate = DateTime.now();
  DateTime _focusedDay = DateTime.now();
  String? _selectedService;
  String? _selectedProvider;
  String? _selectedTime;
  bool _isLoading = false;
  bool _isApiOnline = false;
  List<Map<String, dynamic>> _existingAppointments = [];
  
  // Database'den çekilen hizmetler
  List<Map<String, dynamic>> _allServices = [];
  bool _isLoadingServices = true;
  
  // Database'den çekilen providers
  List<Map<String, dynamic>> _allProviders = [];
  bool _isLoadingProviders = true;

  final List<String> _timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
  ];

  // Filtrelenmiş hizmetler
  List<Map<String, dynamic>> get _filteredServices {
    if (_searchController.text.isEmpty) {
      return _allServices;
    }
    
    final searchTerm = _searchController.text.toLowerCase();
    return _allServices.where((service) {
      return service['name']!.toLowerCase().contains(searchTerm) ||
             service['category']!.toLowerCase().contains(searchTerm);
    }).toList();
  }

  // Seçilen hizmete göre providers
  List<Map<String, dynamic>> get _availableProviders {
    if (_selectedService == null) return _allProviders;
    
    // Seçilen hizmete ait providers'ı filtrele
    final selectedServiceData = _allServices.firstWhere(
      (service) => service['id'] == _selectedService,
      orElse: () => <String, dynamic>{},
    );
    
    if (selectedServiceData.isEmpty) return _allProviders;
    
    // Hizmetin provider_id'si varsa o provider'ı döndür
    final providerId = selectedServiceData['provider_id']?.toString() ?? '';
    if (providerId.isNotEmpty) {
      return _allProviders.where((provider) => 
        provider['id'] == providerId).toList();
    }
    
    // Yoksa tüm providers'ı döndür
    return _allProviders;
  }

  // Filtrelenmiş providers
  List<Map<String, dynamic>> get _filteredProviders {
    if (_providerSearchController.text.isEmpty) {
      return _availableProviders;
    }
    
    final searchTerm = _providerSearchController.text.toLowerCase();
    return _availableProviders.where((provider) {
      return provider['name']!.toLowerCase().contains(searchTerm) ||
             (provider['business_name'] ?? '').toLowerCase().contains(searchTerm) ||
             (provider['specialization'] ?? '').toLowerCase().contains(searchTerm);
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    await _checkApiStatus();
    await _loadServices();
    await _loadProviders();
  }

  Future<void> _checkApiStatus() async {
    try {
      final response = await ApiService.checkConnection();
      setState(() {
        _isApiOnline = response['success'] == true;
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
      if (_isApiOnline) {
        final response = await ApiService.getServices();
        final services = response['services'] as List<dynamic>? ?? [];
        
        setState(() {
          _allServices = services.map<Map<String, dynamic>>((service) {
            final serviceMap = service as Map<String, dynamic>;
            return {
              'id': serviceMap['id']?.toString() ?? '',
              'name': serviceMap['name'] ?? 'Bilinmeyen Hizmet',
              'description': serviceMap['description'] ?? '',
              'duration': '${serviceMap['duration'] ?? 30} dk',
              'price': '${serviceMap['price'] ?? 0} ₺',
              'category': serviceMap['category'] ?? 'Genel',
              'provider_id': serviceMap['provider_id'] ?? '',
            };
          }).toList();
        });
      }
    } catch (e) {
      print('Hizmetler yüklenirken hata: $e');
      setState(() {
        _allServices = [];
      });
    } finally {
      setState(() => _isLoadingServices = false);
    }
  }

  Future<void> _loadProviders() async {
    setState(() => _isLoadingProviders = true);
    
    try {
      if (_isApiOnline) {
        final response = await ApiService.getProviders();
        final providers = response['providers'] as List<dynamic>? ?? [];
        
        setState(() {
          _allProviders = providers.map<Map<String, dynamic>>((provider) {
            final providerMap = provider as Map<String, dynamic>;
            return {
              'id': providerMap['id']?.toString() ?? '',
              'name': providerMap['user_name'] ?? 'Bilinmeyen Provider',
              'business_name': providerMap['business_name'] ?? '',
              'description': providerMap['description'] ?? '',
              'specialization': providerMap['specialization'] ?? '',
              'experience_years': providerMap['experience_years'] ?? 0,
              'rating': providerMap['rating'] ?? 4.0,
              'total_reviews': providerMap['total_reviews'] ?? 0,
              'phone': providerMap['phone'] ?? '',
              'address': providerMap['address'] ?? '',
              'city': providerMap['city'] ?? '',
            };
          }).toList();
        });
      }
    } catch (e) {
      print('Providers yüklenirken hata: $e');
      setState(() {
        _allProviders = [];
      });
    } finally {
      setState(() => _isLoadingProviders = false);
    }
  }

  Future<void> _loadExistingAppointments() async {
    if (!_isApiOnline) return;
    
    try {
      final response = await ApiService.getAppointments();
      final appointments = response['appointments'] as List<dynamic>? ?? [];
      setState(() {
        _existingAppointments = appointments.cast<Map<String, dynamic>>();
      });
    } catch (e) {
      print('Randevular yüklenirken hata: $e');
    }
  }

  bool _isTimeSlotOccupied(String timeSlot) {
    if (_selectedProvider == null) return false;
    
    final selectedProviderData = _availableProviders.firstWhere(
      (provider) => provider['id'] == _selectedProvider,
      orElse: () => <String, dynamic>{},
    );
    
    if (selectedProviderData.isEmpty) return false;
    
    final targetDateTime = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      int.parse(timeSlot.split(':')[0]),
      int.parse(timeSlot.split(':')[1]),
    );
    
    return _existingAppointments.any((appointment) {
      final appointmentDate = DateTime.tryParse(
        '${appointment['appointment_date']} ${appointment['appointment_time']}'
      );
      
      if (appointmentDate == null) return false;
      
      return appointmentDate.year == targetDateTime.year &&
             appointmentDate.month == targetDateTime.month &&
             appointmentDate.day == targetDateTime.day &&
             appointmentDate.hour == targetDateTime.hour &&
             appointmentDate.minute == targetDateTime.minute &&
             appointment['provider_id'] == _selectedProvider;
    });
  }

  Future<void> _createAppointment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedService == null || _selectedProvider == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lütfen hizmet, sağlayıcı ve saat seçiniz'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_userNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lütfen adınızı giriniz'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Seçilen saat dolu mu kontrol et
    if (_isTimeSlotOccupied(_selectedTime!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Seçilen saat dolu. Lütfen başka bir saat seçiniz.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final selectedServiceData = _allServices.firstWhere(
        (service) => service['id'] == _selectedService,
        orElse: () => <String, dynamic>{},
      );

      final selectedProviderData = _availableProviders.firstWhere(
        (provider) => provider['id'] == _selectedProvider,
        orElse: () => <String, dynamic>{},
      );

      // API çağrısı yap
      final result = await ApiService.createAppointment(
        customerName: _userNameController.text.trim(),
        providerId: selectedProviderData['id'],
        serviceId: selectedServiceData['id'],
        appointmentDate: DateFormat('yyyy-MM-dd').format(_selectedDate),
        appointmentTime: _selectedTime!,
        notes: _notesController.text.trim(),
      );

      if (result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Randevu başarıyla oluşturuldu!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(result['message'] ?? 'Randevu oluşturulamadı');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildServiceCard(Map<String, dynamic> service) {
    final isSelected = _selectedService == service['id'];
    final serviceProviderId = service['provider_id']?.toString() ?? '';
    final availableProviderCount = serviceProviderId.isEmpty 
        ? _allProviders.length 
        : _allProviders.where((provider) => provider['id'] == serviceProviderId).length;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedService = service['id'];
          _selectedProvider = null; // Reset provider when service changes
          _selectedTime = null; // Reset time when service changes
          _providerSearchController.clear(); // Clear provider search
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF667eea).withOpacity(0.1) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF667eea) : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service['name']!,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? const Color(0xFF667eea) : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$availableProviderCount sağlayıcı • ${service['category']}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          service['duration']!,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blue.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          service['price']!,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.green.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: Color(0xFF667eea),
                size: 24,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProviderCard(Map<String, dynamic> provider) {
    final isSelected = _selectedProvider == provider['id'];
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedProvider = provider['id'];
          _selectedTime = null; // Reset time when provider changes
        });
        // Randevuları yükle
        _loadExistingAppointments();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF667eea).withOpacity(0.1) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF667eea) : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    provider['name']!,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? const Color(0xFF667eea) : Colors.black87,
                    ),
                  ),
                  if (provider['business_name']?.isNotEmpty == true) ...[
                    const SizedBox(height: 4),
                    Text(
                      provider['business_name']!,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    '${provider['specialization']} • ${provider['experience_years']} yıl deneyim',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.star,
                        color: Colors.amber,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${provider['rating']} (${provider['total_reviews']} değerlendirme)',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: Color(0xFF667eea),
                size: 24,
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Randevu Oluştur'),
        backgroundColor: const Color(0xFF667eea),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // API Durum Göstergesi
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: _isApiOnline ? Colors.green.shade50 : Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _isApiOnline ? Colors.green.shade200 : Colors.red.shade200,
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
                          ? 'Bağlantı başarılı - Gerçek veriler kullanılıyor'
                          : 'API bağlantısı yok - Test modu',
                        style: TextStyle(
                          color: _isApiOnline ? Colors.green.shade700 : Colors.red.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: _checkApiStatus,
                      child: Icon(
                        Icons.refresh,
                        color: _isApiOnline ? Colors.green : Colors.red,
                        size: 20,
                      ),
                    ),
                  ],
                ),
              ),

              // Hizmet Seçimi
              const Text(
                'Hizmet Seç',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              
              // Hizmet Arama
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Hizmet ara...',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {});
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onChanged: (value) {
                  setState(() {});
                },
              ),
              const SizedBox(height: 16),
              
              // Hizmet loading göstergesi
              if (_isLoadingServices)
                const Center(child: CircularProgressIndicator())
              // Hizmet listesi
              else if (_filteredServices.isNotEmpty) ...[
                ..._filteredServices.map((service) {
                  return _buildServiceCard(service);
                }).toList(),
              ] else
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    'Hizmet bulunamadı.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),

              // Provider Seçimi
              if (_selectedService != null) ...[
                const SizedBox(height: 24),
                const Text(
                  'Sağlayıcı Seç',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                
                // Provider Arama
                TextField(
                  controller: _providerSearchController,
                  decoration: InputDecoration(
                    hintText: 'Sağlayıcı ara...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _providerSearchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _providerSearchController.clear();
                              setState(() {});
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onChanged: (value) {
                    setState(() {});
                  },
                ),
                const SizedBox(height: 16),
                
                // Provider loading göstergesi
                if (_isLoadingProviders)
                  const Center(child: CircularProgressIndicator())
                // Provider listesi
                else if (_filteredProviders.isNotEmpty) ...[
                  ..._filteredProviders.map((provider) {
                    return _buildProviderCard(provider);
                  }).toList(),
                ] else
                  const Padding(
                    padding: EdgeInsets.all(20),
                    child: Text(
                      'Bu hizmet için sağlayıcı bulunamadı.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
              ],

              // Tarih Seçimi
              if (_selectedService != null && _selectedProvider != null) ...[
                const SizedBox(height: 24),
                const Text(
                  'Tarih Seç',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: TableCalendar<dynamic>(
                    firstDay: DateTime.now(),
                    lastDay: DateTime.now().add(const Duration(days: 90)),
                    focusedDay: _focusedDay,
                    selectedDayPredicate: (day) {
                      return isSameDay(_selectedDate, day);
                    },
                    onDaySelected: (selectedDay, focusedDay) {
                      setState(() {
                        _selectedDate = selectedDay;
                        _focusedDay = focusedDay;
                        _selectedTime = null; // Reset time when date changes
                      });
                      _loadExistingAppointments();
                    },
                    onPageChanged: (focusedDay) {
                      _focusedDay = focusedDay;
                    },
                    calendarFormat: CalendarFormat.month,
                    availableCalendarFormats: const {
                      CalendarFormat.month: 'Month',
                    },
                    headerStyle: const HeaderStyle(
                      formatButtonVisible: false,
                      titleCentered: true,
                    ),
                  ),
                ),
                
                // Saat Seçimi
                const SizedBox(height: 24),
                const Text(
                  'Saat Seç',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _timeSlots.map((timeSlot) {
                    final isSelected = _selectedTime == timeSlot;
                    final isOccupied = _isTimeSlotOccupied(timeSlot);
                    
                    return GestureDetector(
                      onTap: isOccupied ? null : () {
                        setState(() {
                          _selectedTime = timeSlot;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isOccupied 
                              ? Colors.grey.shade200
                              : isSelected 
                                  ? const Color(0xFF667eea)
                                  : Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isOccupied 
                                ? Colors.grey.shade300
                                : isSelected 
                                    ? const Color(0xFF667eea)
                                    : Colors.grey.shade300,
                          ),
                        ),
                        child: Text(
                          timeSlot,
                          style: TextStyle(
                            color: isOccupied 
                                ? Colors.grey.shade500
                                : isSelected 
                                    ? Colors.white
                                    : Colors.black87,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],

              // Kişisel Bilgiler
              if (_selectedService != null && _selectedProvider != null) ...[
                const SizedBox(height: 24),
                const Text(
                  'Kişisel Bilgiler',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _userNameController,
                  decoration: InputDecoration(
                    labelText: 'Adınız Soyadınız *',
                    hintText: 'Tam adınızı giriniz',
                    prefixIcon: const Icon(Icons.person),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Lütfen adınızı giriniz';
                    }
                    return null;
                  },
                ),
              ],

              // Notlar
              if (_selectedService != null && _selectedProvider != null) ...[
                const SizedBox(height: 16),
                const Text(
                  'Notlar (Opsiyonel)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _notesController,
                  decoration: InputDecoration(
                    hintText: 'Randevunuz hakkında not ekleyebilirsiniz...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  maxLines: 3,
                ),
              ],

              // Randevu Oluştur Butonu
              if (_selectedService != null && _selectedProvider != null && _selectedTime != null) ...[
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _createAppointment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF667eea),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                            'Randevu Oluştur',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ],

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _notesController.dispose();
    _userNameController.dispose();
    _searchController.dispose();
    _providerSearchController.dispose();
    super.dispose();
  }
}