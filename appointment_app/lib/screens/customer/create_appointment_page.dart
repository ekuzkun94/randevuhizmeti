import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
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
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _searchController = TextEditingController();
  final _providerSearchController = TextEditingController();
  final _scrollController = ScrollController();
  
  // Global keys for sections
  final GlobalKey _providerSectionKey = GlobalKey();
  final GlobalKey _timeSectionKey = GlobalKey();
  
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  DateTime _focusedDay = DateTime.now().add(const Duration(days: 1));
  String? _selectedService;
  String? _selectedProvider;
  String? _selectedTime;
  String? _suggestedTime;
  bool _isLoading = false;
  bool _isApiOnline = false;
  List<Map<String, dynamic>> _existingAppointments = [];
  
  // Database services
  List<Map<String, dynamic>> _allServices = [];
  bool _isLoadingServices = true;
  
  // Database providers
  List<Map<String, dynamic>> _allProviders = [];
  bool _isLoadingProviders = true;

  final List<String> _timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
  ];

  // Filtered services
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

  // Available providers based on selected service
  List<Map<String, dynamic>> get _availableProviders {
    // Şu anda tüm provider'ları göster
    // TODO: Service-Provider mapping'ini düzelt
    return _allProviders;
    
    /* Gelecekte düzeltilecek mapping kodu:
    if (_selectedService == null) return _allProviders;
    
    final selectedServiceData = _allServices.firstWhere(
      (service) => service['id'] == _selectedService,
      orElse: () => <String, dynamic>{},
    );
    
    if (selectedServiceData.isEmpty) return _allProviders;
    
    final providerId = selectedServiceData['provider_id']?.toString() ?? '';
    if (providerId.isNotEmpty) {
      // ID mapping problemi var: "provider-001" vs "prov-001"
      // Provider user_id ile eşleştir
      return _allProviders.where((provider) => 
        provider['user_id'] == providerId || 
        provider['id'] == providerId).toList();
    }
    
    return _allProviders;
    */
  }

  // Filtered providers
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

  @override
  void dispose() {
    _notesController.dispose();
    _userNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _searchController.dispose();
    _providerSearchController.dispose();
    _scrollController.dispose();
    super.dispose();
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
              'user_id': providerMap['user_id']?.toString() ?? '',
              'name': providerMap['user_name'] ?? 'Bilinmeyen Provider',
              'business_name': providerMap['business_name'] ?? '',
              'description': providerMap['description'] ?? '',
              'specialization': providerMap['specialization'] ?? '',
              'experience_years': providerMap['experience_years'] ?? 0,
              'rating': (providerMap['rating'] ?? 4.0).toDouble(),
              'total_reviews': providerMap['total_reviews'] ?? 0,
              'phone': providerMap['phone'] ?? '',
              'address': providerMap['address'] ?? '',
              'city': providerMap['city'] ?? '',
              'is_active': providerMap['is_active'] ?? true,
              'is_verified': providerMap['is_verified'] ?? false,
            };
          }).toList();
        });
      } else {
        // API offline durumunda demo provider'lar
        setState(() {
          _allProviders = [
            {
              'id': 'prov-001',
              'user_id': 'provider-001',
              'name': 'Dr. Ahmet Yılmaz',
              'business_name': 'Ahmet\'s Kuaför Salonu',
              'description': 'Profesyonel saç kesimi ve bakım hizmetleri',
              'specialization': 'Saç Kesimi ve Bakımı',
              'experience_years': 15,
              'rating': 4.8,
              'total_reviews': 127,
              'phone': '+90 555 123 4567',
              'address': 'Atatürk Cad. No:123 Kadıköy',
              'city': 'İstanbul',
              'is_active': true,
              'is_verified': true,
            },
            {
              'id': 'prov-002',
              'user_id': 'provider-002',
              'name': 'Dr. Elif Demir',
              'business_name': 'Dr. Elif Demir Kliniği',
              'description': 'Estetik ve güzellik hizmetleri',
              'specialization': 'Estetik ve Güzellik',
              'experience_years': 8,
              'rating': 4.9,
              'total_reviews': 89,
              'phone': '+90 555 234 5678',
              'address': 'Bağdat Cad. No:456 Üsküdar',
              'city': 'İstanbul',
              'is_active': true,
              'is_verified': true,
            },
            {
              'id': 'prov-003',
              'user_id': 'provider-003',
              'name': 'Mehmet Özkan',
              'business_name': 'Özkan Fitness Center',
              'description': 'Kişisel antrenörlük ve fitness koçluğu',
              'specialization': 'Fitness ve Spor',
              'experience_years': 12,
              'rating': 4.6,
              'total_reviews': 156,
              'phone': '+90 555 345 6789',
              'address': 'Nişantaşı Mah. Spor Sok. No:78',
              'city': 'İstanbul',
              'is_active': true,
              'is_verified': true,
            },
          ];
        });
      }
    } catch (e) {
      print('Providers yüklenirken hata: $e');
      // Hata durumunda da demo provider'ları göster
      setState(() {
        _allProviders = [
          {
            'id': 'prov-001',
            'user_id': 'provider-001',
            'name': 'Dr. Ahmet Yılmaz',
            'business_name': 'Ahmet\'s Kuaför Salonu',
            'description': 'Profesyonel saç kesimi ve bakım hizmetleri',
            'specialization': 'Saç Kesimi ve Bakımı',
            'experience_years': 15,
            'rating': 4.8,
            'total_reviews': 127,
            'phone': '+90 555 123 4567',
            'address': 'Atatürk Cad. No:123 Kadıköy',
            'city': 'İstanbul',
            'is_active': true,
            'is_verified': true,
          },
        ];
      });
    } finally {
      setState(() => _isLoadingProviders = false);
    }
  }

  Future<void> _loadExistingAppointments() async {
    if (!_isApiOnline) return;
    
    try {
      final response = await ApiService.getAppointments();
      if (response.containsKey('appointments')) {
        final appointments = response['appointments'] as List<dynamic>? ?? [];
        setState(() {
          _existingAppointments = appointments.cast<Map<String, dynamic>>();
        });
        _suggestBestTime();
      }
    } catch (e) {
      print('Randevular yüklenirken hata: $e');
    }
  }

  void _suggestBestTime() {
    if (_selectedProvider == null) return;
    
    Map<String, int> slotUsage = {};
    for (var time in _timeSlots) {
      final count = _existingAppointments.where((appt) =>
        appt['appointment_date'] == DateFormat('yyyy-MM-dd').format(_selectedDate) &&
        appt['appointment_time'] == time &&
        appt['provider_id'] == _selectedProvider
      ).length;
      slotUsage[time] = count;
    }
    
    var bestTime = slotUsage.entries
        .where((entry) => entry.value == 0)
        .toList();
    
    if (bestTime.isNotEmpty) {
      setState(() {
        _suggestedTime = bestTime.first.key;
      });
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

  bool _isSlotConflicted(String timeSlot) {
    return _existingAppointments.any((appt) =>
      appt['provider_id'] == _selectedProvider &&
      appt['appointment_date'] == DateFormat('yyyy-MM-dd').format(_selectedDate) &&
      appt['appointment_time'] == timeSlot
    );
  }

  bool _hasAppointmentsOnDay(DateTime day) {
    if (_selectedProvider == null) return false;
    
    final dayStr = DateFormat('yyyy-MM-dd').format(day);
    return _existingAppointments.any((appt) => 
      appt['appointment_date'] == dayStr && 
      appt['provider_id'] == _selectedProvider
    );
  }

  void _scrollToSection(GlobalKey key) {
    final context = key.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _createAppointment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedService == null || _selectedProvider == null || _selectedTime == null) {
      _showErrorSnackBar('Lütfen hizmet, sağlayıcı ve saat seçiniz');
      return;
    }

    if (_isSlotConflicted(_selectedTime!)) {
      _showErrorSnackBar('Seçilen saat dolu. Lütfen başka bir saat seçiniz.');
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

      final result = await ApiService.createAppointment(
        customerName: _userNameController.text.trim(),
        customerEmail: _emailController.text.trim(),
        customerPhone: _phoneController.text.trim(),
        providerId: selectedProviderData['id'],
        serviceId: selectedServiceData['id'],
        appointmentDate: DateFormat('yyyy-MM-dd').format(_selectedDate),
        appointmentTime: _selectedTime!,
        notes: _notesController.text.trim(),
      );

      if (result['success'] == true) {
        _showSuccessDialog();
      } else {
        throw Exception(result['message'] ?? 'Randevu oluşturulamadı');
      }
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
        icon: const Icon(Icons.check_circle, color: Colors.green, size: 48),
        title: const Text('Randevu Oluşturuldu!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Randevunuz başarıyla oluşturuldu.'),
            const SizedBox(height: 16),
            _buildAppointmentSummary(),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context, true);
            },
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentSummary() {
    final selectedService = _allServices.firstWhere(
      (service) => service['id'] == _selectedService,
      orElse: () => <String, dynamic>{},
    );
    final selectedProvider = _availableProviders.firstWhere(
      (provider) => provider['id'] == _selectedProvider,
      orElse: () => <String, dynamic>{},
    );

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.medical_services, size: 16, color: Colors.blue),
              const SizedBox(width: 8),
              Expanded(child: Text(selectedService['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.person, size: 16, color: Colors.orange),
              const SizedBox(width: 8),
              Expanded(child: Text(selectedProvider['name'] ?? '')),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 16, color: Colors.green),
              const SizedBox(width: 8),
              Text(DateFormat('dd MMMM yyyy', 'tr_TR').format(_selectedDate)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.access_time, size: 16, color: Colors.purple),
              const SizedBox(width: 8),
              Text(_selectedTime ?? ''),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Randevu Oluştur'),
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
          controller: _scrollController,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildApiStatusCard(),
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
                _buildCustomerInfoSection(),
                const SizedBox(height: 30),
                _buildCreateButton(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildApiStatusCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _isApiOnline ? Colors.green.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _isApiOnline ? Colors.green.shade200 : Colors.red.shade200,
        ),
      ),
      child: Row(
        children: [
          Icon(
            _isApiOnline ? Icons.check_circle : Icons.error,
            color: _isApiOnline ? Colors.green : Colors.red,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _isApiOnline 
                    ? 'API Bağlantısı Aktif' 
                    : 'API Bağlantısı Kapalı',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: _isApiOnline ? Colors.green.shade700 : Colors.red.shade700,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _checkApiStatus,
            icon: Icon(
              Icons.refresh,
              color: _isApiOnline ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '1. Hizmet Seçin',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _searchController,
          onChanged: (value) => setState(() {}),
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
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (_isLoadingServices)
          const Center(child: CircularProgressIndicator())
        else if (_filteredServices.isEmpty)
          const Center(
            child: Text('Henüz hizmet bulunamadı'),
          )
        else
          ...List.generate(
            _filteredServices.length,
            (index) => _buildServiceCard(_filteredServices[index]),
          ),
      ],
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> service) {
    final isSelected = _selectedService == service['id'];
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isSelected ? 4 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? const Color(0xFF667eea) : Colors.grey.shade300,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedService = service['id'];
            _selectedProvider = null;
            _selectedTime = null;
            _providerSearchController.clear();
          });
          _scrollToSection(_providerSectionKey);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF667eea) : Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.medical_services,
                  color: isSelected ? Colors.white : Colors.grey.shade600,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service['name'] ?? '',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? const Color(0xFF667eea) : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      service['description'] ?? '',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
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
                            service['duration'] ?? '30 dk',
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
                            service['price'] ?? '0 ₺',
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
      ),
    );
  }

  Widget _buildProviderSection() {
    return Column(
      key: _providerSectionKey,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '2. Sağlayıcı Seçin',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _providerSearchController,
          onChanged: (value) => setState(() {}),
          decoration: InputDecoration(
            hintText: 'Sağlayıcı ara...',
            prefixIcon: const Icon(Icons.person),
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
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (_isLoadingProviders)
          const Center(child: CircularProgressIndicator())
        else if (_filteredProviders.isEmpty)
          const Center(
            child: Text('Bu hizmet için sağlayıcı bulunamadı'),
          )
        else
          ...List.generate(
            _filteredProviders.length,
            (index) => _buildProviderCard(_filteredProviders[index]),
          ),
      ],
    );
  }

  Widget _buildProviderCard(Map<String, dynamic> provider) {
    final isSelected = _selectedProvider == provider['id'];
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isSelected ? 4 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? const Color(0xFF667eea) : Colors.grey.shade300,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedProvider = provider['id'];
            _selectedTime = null;
          });
          _loadExistingAppointments();
          _scrollToSection(_timeSectionKey);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 25,
                backgroundColor: isSelected ? const Color(0xFF667eea) : Colors.grey.shade300,
                child: Icon(
                  Icons.person,
                  color: isSelected ? Colors.white : Colors.grey.shade600,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      provider['name'] ?? '',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? const Color(0xFF667eea) : Colors.black87,
                      ),
                    ),
                    if (provider['business_name'] != null && provider['business_name']!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        provider['business_name']!,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.star, size: 16, color: Colors.amber.shade600),
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
                    if (provider['specialization'] != null && provider['specialization']!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          provider['specialization']!,
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.orange.shade700,
                          ),
                        ),
                      ),
                    ],
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
      ),
    );
  }

  Widget _buildDateTimeSection() {
    return Column(
      key: _timeSectionKey,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '3. Tarih ve Saat Seçin',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        _buildCalendar(),
        const SizedBox(height: 20),
        _buildTimeSlots(),
      ],
    );
  }

  Widget _buildCalendar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
                            color: Colors.grey.withValues(alpha: 0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: TableCalendar<dynamic>(
        firstDay: DateTime.now(),
        lastDay: DateTime.now().add(const Duration(days: 90)),
        focusedDay: _focusedDay,
        selectedDayPredicate: (day) => isSameDay(_selectedDate, day),
        calendarFormat: CalendarFormat.month,
        startingDayOfWeek: StartingDayOfWeek.monday,
        headerStyle: const HeaderStyle(
          formatButtonVisible: false,
          titleCentered: true,
          titleTextStyle: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        calendarStyle: CalendarStyle(
          outsideDaysVisible: false,
          weekendTextStyle: const TextStyle(color: Colors.red),
          selectedDecoration: const BoxDecoration(
            color: Color(0xFF667eea),
            shape: BoxShape.circle,
          ),
          todayDecoration: BoxDecoration(
            color: Colors.grey.shade400,
            shape: BoxShape.circle,
          ),
          markerDecoration: BoxDecoration(
            color: Colors.orange.shade300,
            shape: BoxShape.circle,
          ),
        ),
        eventLoader: (day) {
          return _hasAppointmentsOnDay(day) ? ['appointment'] : [];
        },
        onDaySelected: (selectedDay, focusedDay) {
          if (!isSameDay(_selectedDate, selectedDay)) {
            setState(() {
              _selectedDate = selectedDay;
              _focusedDay = focusedDay;
              _selectedTime = null;
              _suggestedTime = null;
            });
            _suggestBestTime();
          }
        },
        onPageChanged: (focusedDay) {
          _focusedDay = focusedDay;
        },
      ),
    );
  }

  Widget _buildTimeSlots() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Saat Seçin',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            if (_suggestedTime != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lightbulb, size: 14, color: Colors.green.shade600),
                    const SizedBox(width: 4),
                    Text(
                      'Önerilen: $_suggestedTime',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.green.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _timeSlots.map((time) {
            final isOccupied = _isTimeSlotOccupied(time);
            final isSelected = _selectedTime == time;
            final isSuggested = _suggestedTime == time;
            
            return InkWell(
              onTap: isOccupied ? null : () {
                setState(() {
                  _selectedTime = time;
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isOccupied 
                      ? Colors.red.shade100
                      : isSelected 
                          ? const Color(0xFF667eea)
                          : isSuggested
                              ? Colors.green.shade50
                              : Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isOccupied
                        ? Colors.red.shade300
                        : isSelected
                            ? const Color(0xFF667eea)
                            : isSuggested
                                ? Colors.green.shade300
                                : Colors.grey.shade300,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Text(
                  time,
                  style: TextStyle(
                    color: isOccupied
                        ? Colors.red.shade700
                        : isSelected
                            ? Colors.white
                            : isSuggested
                                ? Colors.green.shade700
                                : Colors.black87,
                    fontWeight: isSelected || isSuggested ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _buildTimeLegend(Colors.white, Colors.grey.shade300, 'Müsait'),
            const SizedBox(width: 16),
            _buildTimeLegend(Colors.red.shade100, Colors.red.shade300, 'Dolu'),
            const SizedBox(width: 16),
            _buildTimeLegend(Colors.green.shade50, Colors.green.shade300, 'Önerilen'),
          ],
        ),
      ],
    );
  }

  Widget _buildTimeLegend(Color bgColor, Color borderColor, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: bgColor,
            border: Border.all(color: borderColor),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildCustomerInfoSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '4. İletişim Bilgileri',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _userNameController,
          decoration: InputDecoration(
            labelText: 'Adınız Soyadınız *',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Ad soyad gereklidir';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: 'E-posta *',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'E-posta gereklidir';
            }
            if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
              return 'Geçerli bir e-posta adresi giriniz';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            labelText: 'Telefon *',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Telefon numarası gereklidir';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _notesController,
          maxLines: 3,
          decoration: InputDecoration(
            labelText: 'Notlar (İsteğe bağlı)',
            alignLabelWithHint: true,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCreateButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _createAppointment,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF667eea),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: _isLoading
            ? const CircularProgressIndicator(color: Colors.white)
            : const Text(
                'Randevu Oluştur',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }
} 