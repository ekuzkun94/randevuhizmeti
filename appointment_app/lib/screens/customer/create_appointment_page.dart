import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:appointment_app/providers/language_provider.dart';
import 'package:appointment_app/services/api_service.dart';

class CreateAppointmentPage extends StatefulWidget {
  const CreateAppointmentPage({super.key});

  @override
  State<CreateAppointmentPage> createState() => _CreateAppointmentPageState();
}

class _CreateAppointmentPageState extends State<CreateAppointmentPage> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _userNameController = TextEditingController();
  final _searchController = TextEditingController();
  final _providerSearchController = TextEditingController();
  final _scrollController = ScrollController();
  final _providerSectionKey = GlobalKey();
  
  DateTime _selectedDate = DateTime.now();
  DateTime _focusedDay = DateTime.now();
  String? _selectedService;
  String? _selectedProvider;
  String? _selectedTime;
  bool _isLoading = false;
  bool _isApiOnline = false;
  List<Map<String, dynamic>> _existingAppointments = [];
  bool _isLoadingAppointments = false;

  // Tüm hizmetler
  final List<Map<String, dynamic>> _allServices = [
    {
      'id': '1',
      'name': 'Genel Muayene',
      'category': 'Tıp',
      'duration': '30 dk',
      'price': '200 ₺',
      'providers': [
        {'id': 'p1', 'name': 'Dr. Ahmet Yılmaz', 'rating': 4.8, 'experience': '10 yıl'},
        {'id': 'p2', 'name': 'Dr. Ayşe Demir', 'rating': 4.9, 'experience': '12 yıl'},
        {'id': 'p3', 'name': 'Dr. Mehmet Öz', 'rating': 4.7, 'experience': '8 yıl'},
      ]
    },
    {
      'id': '2',
      'name': 'Kardiyoloji Muayenesi',
      'category': 'Tıp',
      'duration': '45 dk',
      'price': '300 ₺',
      'providers': [
        {'id': 'p4', 'name': 'Dr. Mehmet Korkmaz', 'rating': 4.9, 'experience': '15 yıl'},
        {'id': 'p5', 'name': 'Dr. Fatma Şahin', 'rating': 4.8, 'experience': '11 yıl'},
      ]
    },
    {
      'id': '3',
      'name': 'Diş Temizliği',
      'category': 'Diş Hekimliği',
      'duration': '45 dk',
      'price': '150 ₺',
      'providers': [
        {'id': 'p6', 'name': 'Dr. Mehmet Kaya', 'rating': 4.6, 'experience': '7 yıl'},
        {'id': 'p7', 'name': 'Dr. Zeynep Aktaş', 'rating': 4.8, 'experience': '9 yıl'},
      ]
    },
    {
      'id': '4',
      'name': 'Diş Dolgusu',
      'category': 'Diş Hekimliği',
      'duration': '60 dk',
      'price': '250 ₺',
      'providers': [
        {'id': 'p8', 'name': 'Dr. Fatma Özkan', 'rating': 4.7, 'experience': '6 yıl'},
        {'id': 'p9', 'name': 'Dr. Ali Yurt', 'rating': 4.9, 'experience': '13 yıl'},
      ]
    },
    {
      'id': '5',
      'name': 'Saç Kesimi',
      'category': 'Güzellik',
      'duration': '30 dk',
      'price': '50 ₺',
      'providers': [
        {'id': 'p10', 'name': 'Usta Ali', 'rating': 4.5, 'experience': '5 yıl'},
        {'id': 'p11', 'name': 'Berber Mehmet', 'rating': 4.8, 'experience': '12 yıl'},
      ]
    },
    {
      'id': '6',
      'name': 'Masaj Terapisi',
      'category': 'Güzellik',
      'duration': '60 dk',
      'price': '120 ₺',
      'providers': [
        {'id': 'p12', 'name': 'Zeynep Hanım', 'rating': 4.9, 'experience': '8 yıl'},
        {'id': 'p13', 'name': 'Ayşe Terzi', 'rating': 4.7, 'experience': '6 yıl'},
      ]
    },
  ];

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

  // Seçilen hizmetin sağlayıcıları
  List<Map<String, dynamic>> get _availableProviders {
    if (_selectedService == null) return [];
    
    final selectedServiceData = _allServices.firstWhere(
      (service) => service['id'] == _selectedService,
    );
    return List<Map<String, dynamic>>.from(selectedServiceData['providers']);
  }

  // Filtrelenmiş sağlayıcılar
  List<Map<String, dynamic>> get _filteredProviders {
    if (_providerSearchController.text.isEmpty) {
      return _availableProviders;
    }
    
    final searchTerm = _providerSearchController.text.toLowerCase();
    return _availableProviders.where((provider) {
      return provider['name']!.toLowerCase().contains(searchTerm) ||
             provider['experience']!.toLowerCase().contains(searchTerm);
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    _checkApiStatus();
  }

  Future<void> _checkApiStatus() async {
    final isOnline = await ApiService.checkApiStatus();
    if (mounted) {
      setState(() {
        _isApiOnline = isOnline;
      });
    }
  }

  Future<void> _loadExistingAppointments() async {
    if (!_isApiOnline) return;
    
    setState(() => _isLoadingAppointments = true);
    
    try {
      final appointments = await ApiService.getAppointments();
      if (mounted) {
        setState(() {
          _existingAppointments = appointments;
        });
      }
    } catch (e) {
      print('Randevular yüklenirken hata: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoadingAppointments = false);
      }
    }
  }

  // Belirli bir bölüme scroll yapma fonksiyonu
  void _scrollToSection(GlobalKey key) {
    // Widget güncellemelerinin tamamlanmasını bekle
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final context = key.currentContext;
      if (context != null) {
        Scrollable.ensureVisible(
          context,
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  // Belirli bir tarih ve saatte randevu var mı kontrol et
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
      final appointmentDate = DateTime.parse(appointment['date_time']);
      final isSameDateTime = appointmentDate.year == targetDateTime.year &&
                           appointmentDate.month == targetDateTime.month &&
                           appointmentDate.day == targetDateTime.day &&
                           appointmentDate.hour == targetDateTime.hour &&
                           appointmentDate.minute == targetDateTime.minute;
      
      // Aynı tarih/saat ve aynı provider'da randevu var mı kontrol et
      final appointmentDescription = appointment['description'].toString().toLowerCase();
      final providerName = selectedProviderData['name'].toString().toLowerCase();
      
      return isSameDateTime && appointmentDescription.contains(providerName);
    });
  }

  @override
  void dispose() {
    _notesController.dispose();
    _userNameController.dispose();
    _searchController.dispose();
    _providerSearchController.dispose();
    _scrollController.dispose();
    super.dispose();
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
          content: Text('Seçilen saat için zaten randevu var. Lütfen başka bir saat seçiniz.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Seçilen hizmet ve sağlayıcı bilgilerini al
      final selectedServiceData = _allServices.firstWhere(
        (service) => service['id'] == _selectedService,
      );
      
      final selectedProviderData = _availableProviders.firstWhere(
        (provider) => provider['id'] == _selectedProvider,
      );

      // Tarih ve saati birleştir
      final appointmentTime = _selectedTime!.split(':');
      final appointmentDateTime = DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        int.parse(appointmentTime[0]),
        int.parse(appointmentTime[1]),
      );

      // API çağrısı yap
      final result = await ApiService.createAppointment(
        title: selectedServiceData['name']!,
        description: _notesController.text.trim().isEmpty 
            ? '${selectedServiceData['name']} - ${selectedProviderData['name']}'
            : _notesController.text.trim(),
        dateTime: appointmentDateTime,
        userName: _userNameController.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Randevu başarıyla oluşturuldu! ID: ${result['appointment_id']}'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hata: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Randevu Oluştur'),
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
            elevation: 0,
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
              child: SingleChildScrollView(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // API Durum Göstergesi
                      _buildApiStatusCard(),
                      const SizedBox(height: 16),

                      // Hizmet Seçimi
                      _buildCollapsibleSection(
                        title: 'Hizmet Seç',
                        isExpanded: _selectedService == null,
                        selectedSummary: _selectedService != null 
                            ? _allServices.firstWhere((s) => s['id'] == _selectedService)['name']
                            : null,
                        onEditPressed: _selectedService != null ? () {
                          setState(() {
                            _selectedService = null;
                            _selectedProvider = null;
                            _selectedTime = null;
                          });
                        } : null,
                        child: Column(
                          children: [
                            // Arama çubuğu
                            TextField(
                              controller: _searchController,
                              decoration: InputDecoration(
                                hintText: 'Hizmet ara... (örn: muayene, diş, saç)',
                                prefixIcon: const Icon(Icons.search),
                                suffixIcon: _searchController.text.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.clear),
                                        onPressed: () {
                                          setState(() {
                                            _searchController.clear();
                                          });
                                        },
                                      )
                                    : null,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                filled: true,
                                fillColor: Colors.grey.shade50,
                              ),
                              onChanged: (value) {
                                setState(() {});
                              },
                            ),
                            const SizedBox(height: 16),
                            
                            // Hizmet listesi
                            ..._filteredServices.map((service) {
                              return _buildServiceCard(service);
                            }).toList(),
                            
                            // Sonuç bulunamadı mesajı
                            if (_filteredServices.isEmpty)
                              const Padding(
                                padding: EdgeInsets.all(20),
                                child: Text(
                                  'Arama kriterinize uygun hizmet bulunamadı.',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Sağlayıcı Seçimi
                      if (_selectedService != null) ...[
                        Container(
                          key: _providerSectionKey,
                          child: _buildCollapsibleSection(
                            title: 'Sağlayıcı Seç',
                            isExpanded: _selectedProvider == null,
                            selectedSummary: _selectedProvider != null 
                                ? _availableProviders.firstWhere((p) => p['id'] == _selectedProvider)['name']
                                : null,
                            onEditPressed: _selectedProvider != null ? () {
                              setState(() {
                                _selectedProvider = null;
                                _selectedTime = null;
                              });
                            } : null,
                            child: Column(
                              children: [
                                // Sağlayıcı arama çubuğu
                                TextField(
                                  controller: _providerSearchController,
                                  decoration: InputDecoration(
                                    hintText: 'Sağlayıcı ara... (örn: Dr. Ahmet)',
                                    prefixIcon: const Icon(Icons.person_search),
                                    suffixIcon: _providerSearchController.text.isNotEmpty
                                        ? IconButton(
                                            icon: const Icon(Icons.clear),
                                            onPressed: () {
                                              setState(() {
                                                _providerSearchController.clear();
                                              });
                                            },
                                          )
                                        : null,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                  ),
                                  onChanged: (value) {
                                    setState(() {});
                                  },
                                ),
                                const SizedBox(height: 16),
                                
                                // Sağlayıcı listesi
                                ..._filteredProviders.map((provider) {
                                  return _buildProviderCard(provider);
                                }).toList(),
                                
                                // Sonuç bulunamadı mesajı
                                if (_filteredProviders.isEmpty)
                                  const Padding(
                                    padding: EdgeInsets.all(20),
                                    child: Text(
                                      'Arama kriterinize uygun sağlayıcı bulunamadı.',
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: Colors.grey,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Tarih Seçimi
                      if (_selectedService != null && _selectedProvider != null) ...[
                        _buildCollapsibleSection(
                          title: 'Tarih Seç',
                          isExpanded: _selectedTime == null,
                          selectedSummary: _selectedTime != null 
                              ? '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}'
                              : null,
                          onEditPressed: _selectedTime != null ? () {
                            setState(() {
                              _selectedTime = null;
                            });
                          } : null,
                          child: TableCalendar<String>(
                            locale: 'tr',
                            firstDay: DateTime.now(),
                            lastDay: DateTime.now().add(const Duration(days: 90)),
                            focusedDay: _focusedDay,
                            calendarFormat: CalendarFormat.month,
                            startingDayOfWeek: StartingDayOfWeek.monday,
                            selectedDayPredicate: (day) {
                              return isSameDay(_selectedDate, day);
                            },
                            onDaySelected: (selectedDay, focusedDay) {
                              setState(() {
                                _selectedDate = selectedDay;
                                _focusedDay = focusedDay;
                                _selectedTime = null; // Reset time selection
                              });
                              // Randevuları yükle
                              _loadExistingAppointments();
                            },
                            calendarStyle: const CalendarStyle(
                              outsideDaysVisible: false,
                              selectedDecoration: BoxDecoration(
                                color: Color(0xFF667eea),
                                shape: BoxShape.circle,
                              ),
                              todayDecoration: BoxDecoration(
                                color: Colors.orange,
                                shape: BoxShape.circle,
                              ),
                            ),
                            headerStyle: const HeaderStyle(
                              formatButtonVisible: false,
                              titleCentered: true,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Saat Seçimi
                      if (_selectedService != null && _selectedProvider != null) ...[
                        _buildSectionCard(
                          title: 'Saat Seçin',
                          child: Column(
                            children: [
                              if (_isLoadingAppointments)
                                const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: CircularProgressIndicator(),
                                )
                              else ...[
                                // Renk açıklaması
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          width: 16,
                                          height: 16,
                                          decoration: const BoxDecoration(
                                            color: Colors.green,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        const Text('Müsait', style: TextStyle(fontSize: 12)),
                                      ],
                                    ),
                                    Row(
                                      children: [
                                        Container(
                                          width: 16,
                                          height: 16,
                                          decoration: const BoxDecoration(
                                            color: Colors.red,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        const Text('Dolu', style: TextStyle(fontSize: 12)),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                // Saat slotları
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: _timeSlots.map((time) {
                                    final isSelected = _selectedTime == time;
                                    final isOccupied = _isTimeSlotOccupied(time);
                                    
                                    return GestureDetector(
                                      onTap: isOccupied ? null : () {
                                        setState(() {
                                          _selectedTime = time;
                                        });
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                        decoration: BoxDecoration(
                                          color: isOccupied 
                                              ? Colors.red.shade100
                                              : isSelected 
                                                  ? const Color(0xFF667eea) 
                                                  : Colors.green.shade100,
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(
                                            color: isOccupied
                                                ? Colors.red
                                                : isSelected 
                                                    ? const Color(0xFF667eea) 
                                                    : Colors.green,
                                          ),
                                        ),
                                        child: Text(
                                          time,
                                          style: TextStyle(
                                            color: isOccupied
                                                ? Colors.red.shade700
                                                : isSelected 
                                                    ? Colors.white 
                                                    : Colors.green.shade700,
                                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                          ),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Kişisel Bilgiler
                      if (_selectedService != null && _selectedProvider != null) ...[
                        _buildSectionCard(
                          title: 'Kişisel Bilgiler',
                          child: TextFormField(
                            controller: _userNameController,
                            decoration: InputDecoration(
                              labelText: 'Ad Soyad *',
                              hintText: 'Adınızı ve soyadınızı giriniz',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                              prefixIcon: const Icon(Icons.person),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Ad soyad zorunludur';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Notlar
                      if (_selectedService != null && _selectedProvider != null) ...[
                        _buildSectionCard(
                          title: 'Notlar (Opsiyonel)',
                          child: TextFormField(
                            controller: _notesController,
                            maxLines: 3,
                            decoration: InputDecoration(
                              hintText: 'Randevu ile ilgili notlarınızı yazın...',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Randevu Oluştur Butonu
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _createAppointment,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: const Color(0xFF667eea),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              elevation: 4,
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.check, size: 24),
                                      SizedBox(width: 8),
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
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildApiStatusCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: _isApiOnline ? Colors.green.shade50 : Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(12),
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
                    ? 'API Bağlantısı Aktif' 
                    : 'API Bağlantısı Yok - Offline Mod',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: _isApiOnline ? Colors.green.shade700 : Colors.red.shade700,
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
    );
  }

  Widget _buildSectionCard({required String title, required Widget child}) {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF667eea),
              ),
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> service) {
    final isSelected = _selectedService == service['id'];
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedService = service['id'];
          _selectedProvider = null; // Reset provider when service changes
          _selectedTime = null; // Reset time when service changes
          _providerSearchController.clear(); // Clear provider search
        });
        
        // Sağlayıcı bölümüne scroll yap
        _scrollToSection(_providerSectionKey);
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
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF667eea) : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.medical_services,
                color: isSelected ? Colors.white : Colors.grey.shade600,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
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
                    '${service['providers'].length} sağlayıcı • ${service['category']}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: Colors.grey.shade500,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        service['duration']!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Icon(
                        Icons.monetization_on,
                        size: 14,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        service['price']!,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.orange,
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
            CircleAvatar(
              radius: 24,
              backgroundColor: isSelected ? const Color(0xFF667eea) : Colors.grey.shade300,
              child: Icon(
                Icons.person,
                color: isSelected ? Colors.white : Colors.grey.shade600,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
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
                  const SizedBox(height: 4),
                  Text(
                    'Deneyim: ${provider['experience']}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.star,
                        size: 16,
                        color: Colors.amber,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        provider['rating'].toString(),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber,
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
} 