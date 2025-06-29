import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:appointment_app/services/hybrid_api_service.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:appointment_app/providers/auth_provider.dart';
import 'package:appointment_app/services/api_service.dart';
import 'package:appointment_app/models/staff_model.dart';

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

class _CreateAppointmentPageState extends State<CreateAppointmentPage>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _searchController = TextEditingController();
  final _providerSearchController = TextEditingController();

  late TabController _tabController;
  int _currentTabIndex = 0;

  // Ödeme bilgileri
  String _paymentMethod =
      'cash_on_service'; // 'cash_on_service' veya 'online_payment'
  final _cardNumberController = TextEditingController();
  final _cardHolderController = TextEditingController();
  final _expiryDateController = TextEditingController();
  final _cvvController = TextEditingController();

  DateTime? _selectedDate = DateTime.now().add(const Duration(days: 1));
  DateTime _focusedDay = DateTime.now().add(const Duration(days: 1));
  String? _selectedService;
  String? _selectedProvider;
  String? _selectedStaff;
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
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
  ];

  // Kullanıcı bilgileri için değişkenler (UserModel'den alınacak)
  String? _userName;
  String? _userEmail;
  String? _userPhone;

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
    if (_selectedService == null) return _allProviders;

    final selectedServiceData = _allServices.firstWhere(
      (service) => service['id'] == _selectedService,
      orElse: () => <String, dynamic>{},
    );

    if (selectedServiceData.isEmpty) return _allProviders;

    final serviceProviderId =
        selectedServiceData['provider_id']?.toString() ?? '';
    if (serviceProviderId.isNotEmpty) {
      // Tip uyumsuzluğunu önlemek için .toString() ile karşılaştır
      return _allProviders
          .where((provider) => provider['id'].toString() == serviceProviderId)
          .toList();
    }

    return _allProviders;
  }

  // Filtered providers
  List<Map<String, dynamic>> get _filteredProviders {
    if (_providerSearchController.text.isEmpty) {
      return _availableProviders;
    }

    final searchTerm = _providerSearchController.text.toLowerCase();
    return _availableProviders.where((provider) {
      return provider['name']!.toLowerCase().contains(searchTerm) ||
          (provider['business_name'] ?? '')
              .toLowerCase()
              .contains(searchTerm) ||
          (provider['specialization'] ?? '').toLowerCase().contains(searchTerm);
    }).toList();
  }

  List<Staff> _staffList = [];
  bool _isLoadingStaff = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 5,
      vsync: this,
      animationDuration: const Duration(milliseconds: 300),
    );
    _tabController.addListener(_handleTabChange);
    _initializeData();
    // Kullanıcı bilgilerini AuthProvider'dan al
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user =
          Provider.of<AuthProvider>(context, listen: false).currentUser;
      setState(() {
        _userName = user?.name;
        _userEmail = user?.email;
        _userPhone = user?.phone;
      });
    });
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    _notesController.dispose();
    _searchController.dispose();
    _providerSearchController.dispose();
    _cardNumberController.dispose();
    _cardHolderController.dispose();
    _expiryDateController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  void _handleTabChange() {
    if (_tabController.indexIsChanging) {
      setState(() {
        _currentTabIndex = _tabController.index;
      });
    }
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

      debugPrint('🔍 Services API Response: ${services.length} services found');
      if (services.isNotEmpty) {
        debugPrint('🔍 First service: ${services.first}');
      }

      setState(() {
        _allServices = services.map<Map<String, dynamic>>((service) {
          final serviceMap = service as Map<String, dynamic>;
          return {
            'id': serviceMap['id']?.toString() ?? '',
            'name': serviceMap['name'] ?? 'Bilinmeyen Hizmet',
            'description': serviceMap['description'] ?? '',
            'duration': serviceMap['duration'] ?? 30,
            'price': (serviceMap['price'] ?? 0.0).toDouble(),
            'category': serviceMap['category'] ?? 'Genel',
            'provider_id': serviceMap['provider_id']?.toString() ?? '',
            'is_active': serviceMap['is_active'] ?? true,
          };
        }).toList();
      });

      debugPrint('✅ Services loaded: ${_allServices.length} services');
    } catch (e) {
      debugPrint('❌ Hizmetler yüklenirken hata: $e');
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
      final hybridApi = HybridApiService();
      final response = await hybridApi.getProviders();
      debugPrint('🟢 RAW PROVIDERS RESPONSE: $response');
      final providers = response['providers'] as List<dynamic>? ?? [];

      debugPrint(
          '🔍 Providers API Response: ${providers.length} providers found');
      if (providers.isNotEmpty) {
        debugPrint('🔍 First provider: ${providers.first}');
      }

      setState(() {
        _allProviders = providers.map<Map<String, dynamic>>((provider) {
          final providerMap = provider as Map<String, dynamic>;
          return {
            'id': providerMap['id']?.toString() ??
                '', // server_id yerine id kullan
            'user_id': providerMap['user_id']?.toString() ?? '',
            'name': providerMap['name'] ??
                'Bilinmeyen Provider', // user_name yerine name kullan
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

      debugPrint('✅ Providers loaded: ${_allProviders.length} providers');
    } catch (e) {
      debugPrint('❌ Providers yüklenirken hata: $e');
      setState(() {
        _allProviders = [];
      });
    } finally {
      setState(() => _isLoadingProviders = false);
    }
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
        _suggestBestTime();
      }
    } catch (e) {
      debugPrint('Randevular yüklenirken hata: $e');
    }
  }

  void _suggestBestTime() {
    if (_selectedDate == null) return;

    Map<String, int> slotUsage = {};
    for (var time in _timeSlots) {
      final count = _existingAppointments
          .where((appt) =>
              appt['appointment_date'] ==
                  DateFormat('yyyy-MM-dd').format(_selectedDate!) &&
              appt['appointment_time'] == time &&
              appt['provider_id'] == _selectedProvider)
          .length;
      slotUsage[time] = count;
    }

    var bestTime =
        slotUsage.entries.where((entry) => entry.value == 0).toList();

    if (bestTime.isNotEmpty) {
      setState(() {
        _suggestedTime = bestTime.first.key;
      });
    }
  }

  bool _isTimeSlotOccupied(String timeSlot) {
    if (_selectedProvider == null || _selectedDate == null) return false;

    return _existingAppointments.any((appointment) {
      return appointment['appointment_date'] ==
              DateFormat('yyyy-MM-dd').format(_selectedDate!) &&
          appointment['appointment_time'] == timeSlot &&
          appointment['provider_id'] == _selectedProvider;
    });
  }

  bool _isSlotConflicted(String timeSlot) {
    if (_selectedDate == null) return false;

    return _existingAppointments.any((appt) =>
        appt['provider_id'] == _selectedProvider &&
        appt['appointment_date'] ==
            DateFormat('yyyy-MM-dd').format(_selectedDate!) &&
        appt['appointment_time'] == timeSlot);
  }

  bool _hasAppointmentsOnDay(DateTime day) {
    if (_selectedProvider == null) return false;

    final dayStr = DateFormat('yyyy-MM-dd').format(day);
    return _existingAppointments.any((appt) =>
        appt['appointment_date'] == dayStr &&
        appt['provider_id'] == _selectedProvider);
  }

  void _goToNextTab() {
    if (_currentTabIndex < 4) {
      _tabController.animateTo(_currentTabIndex + 1);
    }
  }

  bool _canAccessTab(int tabIndex) {
    switch (tabIndex) {
      case 0:
        return true; // Hizmet sekmesi her zaman erişilebilir
      case 1:
        return _selectedService != null; // Sağlayıcı sekmesi
      case 2:
        return _selectedService != null &&
            _selectedProvider != null; // Tarih/Saat sekmesi
      case 3:
        return _selectedService != null &&
            _selectedProvider != null &&
            _selectedTime != null; // Bilgiler sekmesi
      case 4:
        return _selectedService != null &&
            _selectedProvider != null &&
            _selectedTime != null &&
            _selectedStaff != null; // Ödeme sekmesi
      default:
        return false;
    }
  }

  Future<void> _createAppointment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedService == null ||
        _selectedProvider == null ||
        _selectedTime == null ||
        _selectedDate == null) {
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

      final hybridApi = HybridApiService();
      await hybridApi.createAppointment(
        customerName: _userName!,
        customerEmail: _userEmail!,
        customerPhone: _userPhone!,
        providerId: selectedProviderData['id'],
        serviceId: selectedServiceData['id'],
        appointmentDate: DateFormat('yyyy-MM-dd').format(_selectedDate!),
        appointmentTime: _selectedTime!,
        notes: _notesController.text.trim(),
        paymentMethod: _paymentMethod,
        cardNumber: _paymentMethod == 'online_payment'
            ? _cardNumberController.text.trim()
            : null,
        cardHolder: _paymentMethod == 'online_payment'
            ? _cardHolderController.text.trim()
            : null,
        expiryDate: _paymentMethod == 'online_payment'
            ? _expiryDateController.text.trim()
            : null,
        cvv: _paymentMethod == 'online_payment'
            ? _cvvController.text.trim()
            : null,
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
              'Randevunuz başarıyla oluşturuldu.',
              style: TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            _buildAppointmentSummary(),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context); // Dialog'u kapat
                  Navigator.pop(context); // Randevu oluştur sayfasından çık
                  // Müşteri dashboard'a git
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
                  'Müşteri Paneline Dön',
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF667eea).withValues(alpha: 0.1),
            const Color(0xFF764ba2).withValues(alpha: 0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border:
            Border.all(color: const Color(0xFF667eea).withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF667eea).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.summarize_outlined,
                  color: Color(0xFF667eea),
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Randevu Özeti',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF667eea),
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildSummaryRow(
            Icons.medical_services,
            'Hizmet',
            selectedService['name'] ?? '',
            Colors.blue,
          ),
          const SizedBox(height: 8),
          _buildSummaryRow(
            Icons.person,
            'Sağlayıcı',
            selectedProvider['name'] ?? '',
            Colors.orange,
          ),
          const SizedBox(height: 8),
          _buildSummaryRow(
            Icons.calendar_today,
            'Tarih',
            _selectedDate != null
                ? DateFormat('dd MMMM yyyy', 'tr_TR').format(_selectedDate!)
                : 'Seçilmedi',
            Colors.green,
          ),
          const SizedBox(height: 8),
          _buildSummaryRow(
            Icons.access_time,
            'Saat',
            _selectedTime ?? '',
            Colors.purple,
          ),
          const SizedBox(height: 8),
          _buildSummaryRow(
            Icons.payments,
            'Ücret',
            selectedService['price'] ?? '0 ₺',
            Colors.red,
          ),
          const SizedBox(height: 8),
          _buildSummaryRow(
            _paymentMethod == 'cash_on_service'
                ? Icons.money
                : Icons.credit_card,
            'Ödeme',
            _paymentMethod == 'cash_on_service' ? 'Yerinde Öde' : 'Şimdi Öde',
            _paymentMethod == 'cash_on_service' ? Colors.orange : Colors.blue,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(
      IconData icon, String label, String value, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Icon(icon, size: 14, color: color),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Row(
            children: [
              Text(
                '$label: ',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Expanded(
                child: Text(
                  value,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ],
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
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(100),
          child: Column(
            children: [
              _buildApiStatusCard(),
              const SizedBox(height: 8),
              _buildCustomTabBar(),
            ],
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: TabBarView(
          controller: _tabController,
          physics:
              const NeverScrollableScrollPhysics(), // Swipe'ı devre dışı bırak
          children: _tabContents,
        ),
      ),
    );
  }

  Widget _buildCustomTabBar() {
    final steps = [
      {'title': 'Hizmet', 'icon': Icons.medical_services},
      {'title': 'Sağlayıcı', 'icon': Icons.person},
      {'title': 'Personel', 'icon': Icons.person},
      {'title': 'Tarih/Saat', 'icon': Icons.schedule},
      {'title': 'Ödeme', 'icon': Icons.payment},
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: List.generate(steps.length, (index) {
          final isCompleted = _canAccessTab(index + 1);
          final isCurrent = _currentTabIndex == index;
          final isAccessible = _canAccessTab(index);

          return Expanded(
            child: GestureDetector(
              onTap: isAccessible
                  ? () {
                      _tabController.animateTo(index);
                    }
                  : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 2),
                padding:
                    const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                decoration: BoxDecoration(
                  color: isCurrent
                      ? const Color(0xFF667eea)
                      : isCompleted
                          ? Colors.green.withValues(alpha: 0.1)
                          : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isCurrent
                        ? const Color(0xFF667eea)
                        : isCompleted
                            ? Colors.green
                            : isAccessible
                                ? Colors.grey.shade300
                                : Colors.grey.shade200,
                    width: 1,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isCompleted
                          ? Icons.check_circle
                          : steps[index]['icon'] as IconData,
                      color: isCurrent
                          ? Colors.white
                          : isCompleted
                              ? Colors.green
                              : isAccessible
                                  ? const Color(0xFF667eea)
                                  : Colors.grey.shade400,
                      size: 20,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      steps[index]['title'] as String,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight:
                            isCurrent ? FontWeight.bold : FontWeight.w500,
                        color: isCurrent
                            ? Colors.white
                            : isCompleted
                                ? Colors.green
                                : isAccessible
                                    ? const Color(0xFF667eea)
                                    : Colors.grey.shade400,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildApiStatusCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: _isApiOnline ? Colors.green.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _isApiOnline ? Colors.green.shade200 : Colors.red.shade200,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _isApiOnline ? Icons.wifi : Icons.wifi_off,
            color: _isApiOnline ? Colors.green : Colors.red,
            size: 16,
          ),
          const SizedBox(width: 8),
          Text(
            _isApiOnline ? 'Çevrimiçi' : 'Çevrimdışı',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: _isApiOnline ? Colors.green.shade700 : Colors.red.shade700,
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _checkApiStatus,
            child: Icon(
              Icons.refresh,
              color: _isApiOnline ? Colors.green : Colors.red,
              size: 16,
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
          'Hizmet Seçin',
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
          _goToNextTab(); // Sağlayıcı sekmesine geç
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
                  color: isSelected
                      ? const Color(0xFF667eea)
                      : Colors.grey.shade200,
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
                        color: isSelected
                            ? const Color(0xFF667eea)
                            : Colors.black87,
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
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${service['duration'] ?? '30 dk'}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.blue.shade700,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${service['price'] ?? '0 ₺'}',
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

  // Tab Content metodları
  Widget _buildServiceTabContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: _buildServiceSection(),
    );
  }

  Widget _buildProviderTabContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: _buildProviderSection(),
    );
  }

  Widget _buildProviderSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Sağlayıcı Seçin',
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
        onTap: () async {
          setState(() {
            _selectedProvider = provider['id'];
            _selectedStaff = null;
            _selectedTime = null;
          });
          await _loadStaffByProvider(provider['id']);
          _goToNextTab(); // Staff sekmesine geç
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 25,
                backgroundColor:
                    isSelected ? const Color(0xFF667eea) : Colors.grey.shade300,
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
                        color: isSelected
                            ? const Color(0xFF667eea)
                            : Colors.black87,
                      ),
                    ),
                    if (provider['business_name'] != null &&
                        provider['business_name']!.isNotEmpty) ...[
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
                        Icon(Icons.star,
                            size: 16, color: Colors.amber.shade600),
                        const SizedBox(width: 4),
                        Text(
                          '${(provider['rating'] is num ? (provider['rating'] as num).toStringAsFixed(1) : '0.0')} (${provider['total_reviews'] ?? 0} değerlendirme)',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                    if (provider['specialization'] != null &&
                        provider['specialization']!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
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

  Widget _buildStaffTabContent() {
    if (_isLoadingStaff) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_staffList.isEmpty) {
      return const Center(
          child: Text('Bu sağlayıcıya ait personel bulunamadı.'));
    }
    return ListView.builder(
      shrinkWrap: true,
      itemCount: _staffList.length,
      itemBuilder: (context, index) {
        final staff = _staffList[index];
        final isSelected = _selectedStaff == staff.id;
        return Card(
          color: isSelected ? Colors.blue.shade50 : null,
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text(staff.fullName),
            subtitle: Text(staff.position),
            trailing: isSelected ? const Icon(Icons.check, color: Colors.blue) : null,
            onTap: () {
              setState(() {
                _selectedStaff = staff.id;
                _selectedTime = null;
              });
              _goToNextTab(); // Tarih/Saat sekmesine geç
            },
          ),
        );
      },
    );
  }

  Widget _buildDateTimeTabContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: _buildDateTimeSection(),
    );
  }

  Widget _buildDateTimeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tarih ve Saat Seçin',
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
                    Icon(Icons.lightbulb,
                        size: 14, color: Colors.green.shade600),
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
                child: Icon(Icons.info_outline,
                    size: 16, color: Colors.blue.shade700),
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
            final isOccupied = _isTimeSlotOccupied(time);
            final isSelected = _selectedTime == time;
            final isSuggested = _suggestedTime == time;
            final isPastTime = _selectedDate != null &&
                _selectedDate!.isAtSameMomentAs(DateTime.now()) &&
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
            } else if (isSuggested) {
              backgroundColor = Colors.green.shade50;
              borderColor = Colors.green;
              textColor = Colors.green.shade700;
            } else {
              backgroundColor = Colors.green.shade50;
              borderColor = Colors.green.shade200;
              textColor = Colors.green.shade600;
            }

            return GestureDetector(
              onTap: isEnabled
                  ? () {
                      setState(() {
                        _selectedTime = time;
                      });
                      _goToNextTab(); // Bilgiler sekmesine geç
                    }
                  : null,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: backgroundColor,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: borderColor,
                    width: isSelected ? 2 : 1,
                  ),
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
                    ] else if (isSuggested && !isSelected) ...[
                      Icon(Icons.star, size: 16, color: textColor),
                      const SizedBox(width: 4),
                    ],
                    Text(
                      time,
                      style: TextStyle(
                        color: textColor,
                        fontWeight: isSelected || isSuggested
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                  ],
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
            _buildTimeLegend(
                Colors.green.shade50, Colors.green.shade300, 'Önerilen'),
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

  Widget _buildPaymentTabContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildPaymentSection(),
          const SizedBox(height: 30),
          _buildCreateButton(),
          TextFormField(
            controller: _notesController,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Notlar (İsteğe bağlı)',
              prefixIcon: const Icon(Icons.note_outlined),
              alignLabelWithHint: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSection() {
    final selectedService = _allServices.firstWhere(
      (service) => service['id'] == _selectedService,
      orElse: () => <String, dynamic>{},
    );

    final price = selectedService['price'] ?? '0 ₺';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ödeme Bilgileri',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),

        // Fiyat Kartı
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.green.shade50,
                Colors.green.shade100,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.green.shade200),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green.shade200,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.attach_money,
                  color: Colors.green,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Toplam Tutar',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      price is num
                          ? price.toStringAsFixed(2)
                          : price.toString(),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Ödeme Yöntemi Seçimi
        const Text(
          'Ödeme Yöntemi',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),

        _buildPaymentMethodCard(
          'cash_on_service',
          'Yerinde Öde',
          'Randevu anında nakit olarak ödeme yapın',
          Icons.money,
          Colors.orange,
        ),
        const SizedBox(height: 12),

        _buildPaymentMethodCard(
          'online_payment',
          'Şimdi Öde',
          'Kredi kartı ile hemen ödeme yapın',
          Icons.credit_card,
          Colors.blue,
        ),

        // Kredi kartı formu (sadece "Şimdi Öde" seçildiğinde)
        if (_paymentMethod == 'online_payment') ...[
          const SizedBox(height: 24),
          _buildCreditCardForm(),
        ],
      ],
    );
  }

  Widget _buildPaymentMethodCard(
      String value, String title, String subtitle, IconData icon, Color color) {
    final isSelected = _paymentMethod == value;

    return GestureDetector(
      onTap: () {
        setState(() {
          _paymentMethod = value;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.1) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: color.withValues(alpha: 0.2),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected
                    ? color.withValues(alpha: 0.2)
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: isSelected ? color : Colors.grey.shade600,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? color : Colors.black,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 16,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreditCardForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.credit_card, color: Colors.blue),
              SizedBox(width: 8),
              Text(
                'Kredi Kartı Bilgileri',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _cardHolderController,
            decoration: const InputDecoration(
              labelText: 'Kart Sahibi',
              prefixIcon: Icon(Icons.person_outline),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (_paymentMethod == 'online_payment' &&
                  (value == null || value.trim().isEmpty)) {
                return 'Kart sahibi adı gerekli';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _cardNumberController,
            decoration: const InputDecoration(
              labelText: 'Kart Numarası',
              prefixIcon: Icon(Icons.credit_card),
              border: OutlineInputBorder(),
              hintText: '1234 5678 9012 3456',
            ),
            keyboardType: TextInputType.number,
            validator: (value) {
              if (_paymentMethod == 'online_payment' &&
                  (value == null || value.trim().isEmpty)) {
                return 'Kart numarası gerekli';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _expiryDateController,
                  decoration: const InputDecoration(
                    labelText: 'Son Kullanma',
                    prefixIcon: Icon(Icons.date_range),
                    border: OutlineInputBorder(),
                    hintText: 'MM/YY',
                  ),
                  validator: (value) {
                    if (_paymentMethod == 'online_payment' &&
                        (value == null || value.trim().isEmpty)) {
                      return 'Son kullanma tarihi gerekli';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _cvvController,
                  decoration: const InputDecoration(
                    labelText: 'CVV',
                    prefixIcon: Icon(Icons.lock_outline),
                    border: OutlineInputBorder(),
                    hintText: '123',
                  ),
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  validator: (value) {
                    if (_paymentMethod == 'online_payment' &&
                        (value == null || value.trim().isEmpty)) {
                      return 'CVV gerekli';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.security, color: Colors.blue, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Kart bilgileriniz güvenli şekilde şifrelenir.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
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

  List<Widget> get _tabContents => [
        _buildServiceTabContent(),
        _buildProviderTabContent(),
        _buildStaffTabContent(),
        _buildDateTimeTabContent(),
        _buildPaymentTabContent(),
      ];

  void _onServiceSelected(String? serviceId) {
    setState(() {
      _selectedService = serviceId;
      _selectedProvider = null;
      _selectedStaff = null;
      _selectedDate = null;
      _selectedTime = null;
    });

    // Servis seçildiğinde o servise ait providerları yükle
    if (serviceId != null) {
      _loadProvidersByService(serviceId);
    } else {
      // Servis seçimi kaldırıldığında tüm providerları yükle
      _loadProviders();
    }
  }

  void _onProviderSelected(String? providerId) {
    setState(() {
      _selectedProvider = providerId;
      _selectedStaff = null;
      _selectedDate = null;
      _selectedTime = null;
    });

    // Provider seçildiğinde o provider'a ait staff'ı yükle
    if (providerId != null) {
      _loadStaffByProvider(providerId);
    } else {
      setState(() {
        _staffList = [];
      });
    }
  }

  // Provider'a ait staff'ı yükle
  Future<void> _loadStaffByProvider(String providerId) async {
    setState(() => _isLoadingStaff = true);

    try {
      // Eğer servis de seçilmişse, hem provider hem de servise göre staff'ı getir
      if (_selectedService != null) {
        final staffData = await ApiService.getStaffByProviderAndService(
            providerId, _selectedService!);
        final staff = staffData.map((json) => Staff.fromJson(json)).toList();

        setState(() {
          _staffList = staff;
        });

        debugPrint(
            '✅ Staff loaded (by provider and service): ${_staffList.length} staff members');
      } else {
        // Sadece provider'a göre staff'ı getir
        final staffData = await ApiService.getStaffByProvider(providerId);
        final staff = staffData.map((json) => Staff.fromJson(json)).toList();

        setState(() {
          _staffList = staff;
        });

        debugPrint(
            '✅ Staff loaded (by provider only): ${_staffList.length} staff members');
      }
    } catch (e) {
      debugPrint('❌ Staff yüklenirken hata: $e');
      setState(() {
        _staffList = [];
      });
    } finally {
      setState(() => _isLoadingStaff = false);
    }
  }

  // Servise göre staff'ı yükle
  Future<void> _loadStaffByService(String serviceId) async {
    setState(() => _isLoadingStaff = true);

    try {
      final staffData = await ApiService.getStaffByService(serviceId);
      final staff = staffData.map((json) => Staff.fromJson(json)).toList();

      setState(() {
        _staffList = staff;
      });

      debugPrint(
          '✅ Staff loaded (by service): ${_staffList.length} staff members');
    } catch (e) {
      debugPrint('❌ Staff yüklenirken hata: $e');
      setState(() {
        _staffList = [];
      });
    } finally {
      setState(() => _isLoadingStaff = false);
    }
  }

  // Servis seçildiğinde o servise ait providerları yükle
  Future<void> _loadProvidersByService(String serviceId) async {
    setState(() => _isLoadingProviders = true);

    try {
      final providers = await ApiService.getProvidersByService(serviceId);
      debugPrint('🟢 SERVICE PROVIDERS RESPONSE: $providers');

      setState(() {
        _allProviders = providers.map<Map<String, dynamic>>((provider) {
          return {
            'id': provider['id']?.toString() ?? '',
            'user_id': provider['user_id']?.toString() ?? '',
            'name': provider['business_name'] ?? 'Bilinmeyen Provider',
            'business_name': provider['business_name'] ?? '',
            'description': provider['bio'] ?? '',
            'specialization': provider['specialization'] ?? '',
            'experience_years': provider['experience_years'] ?? 0,
            'rating': (provider['rating'] ?? 4.0).toDouble(),
            'total_reviews': provider['total_reviews'] ?? 0,
            'phone': provider['phone'] ?? '',
            'address': provider['address'] ?? '',
            'city': provider['city'] ?? '',
            'is_active': provider['is_active'] ?? true,
            'is_verified': provider['is_verified'] ?? false,
          };
        }).toList();
      });

      debugPrint(
          '✅ Service providers loaded: ${_allProviders.length} providers');
    } catch (e) {
      debugPrint('❌ Service providers yüklenirken hata: $e');
      setState(() {
        _allProviders = [];
      });
    } finally {
      setState(() => _isLoadingProviders = false);
    }
  }
}
