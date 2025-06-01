import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_model.dart';
import '../../models/service_model.dart';
import '../../models/working_hours_model.dart';
import '../../models/appointment_model.dart';
import 'package:intl/intl.dart';

class CreateAppointmentPage extends StatefulWidget {
  const CreateAppointmentPage({super.key});

  @override
  State<CreateAppointmentPage> createState() => _CreateAppointmentPageState();
}

class _CreateAppointmentPageState extends State<CreateAppointmentPage> {
  final _formKey = GlobalKey<FormState>();
  final _noteController = TextEditingController();
  ServiceModel? _selectedService;
  UserModel? _selectedProvider;
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  bool _isLoading = false;
  String? _error;
  int _currentPage = 0;
  static const int _daysPerPage = 7;
  static const int _totalDays = 365; // 1 yıl

  List<ServiceModel> _services = [];
  List<UserModel> _providers = [];
  List<WorkingHoursModel> _workingHours = [];
  List<TimeOfDay> _availableTimeSlots = [];
  List<DateTime> _availableDates = [];
  Map<DateTime, List<TimeOfDay>> _dateTimeSlots = {};

  @override
  void initState() {
    super.initState();
    _loadServices();
    _generateAvailableDates();
  }

  void _generateAvailableDates() {
    final now = DateTime.now();
    _availableDates = List.generate(_totalDays, (index) {
      return DateTime(now.year, now.month, now.day + index);
    });
  }

  void _loadPageDates() {
    final startIndex = _currentPage * _daysPerPage;
    final endIndex = startIndex + _daysPerPage;
    final pageDates = _availableDates.sublist(
      startIndex,
      endIndex > _availableDates.length ? _availableDates.length : endIndex,
    );
    
    // Mevcut tarihleri temizle
    _dateTimeSlots.clear();
    
    // Yeni tarihleri ekle
    for (final date in pageDates) {
      if (_dateTimeSlots.containsKey(date)) {
        _dateTimeSlots[date] = _dateTimeSlots[date]!;
      }
    }
  }

  void _nextPage() {
    if ((_currentPage + 1) * _daysPerPage < _totalDays) {
      setState(() {
        _currentPage++;
        _loadAvailableTimeSlots();
      });
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      setState(() {
        _currentPage--;
        _loadAvailableTimeSlots();
      });
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _loadServices() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final servicesSnapshot = await FirebaseFirestore.instance
          .collection('services')
          .where('isActive', isEqualTo: true)
          .get();

      final services = servicesSnapshot.docs
          .map((doc) => ServiceModel.fromMap(doc.data()))
          .toList();

      setState(() {
        _services = services;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Hizmetler yüklenemedi: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadProvidersForService() async {
    if (_selectedService == null) return;

    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      print('Hizmet sağlayıcılar yükleniyor...');

      // Önce hizmeti sunan sağlayıcıları bul
      final providersSnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('role', isEqualTo: 'serviceProvider')
          .get();

      final providers = providersSnapshot.docs
          .map((doc) => UserModel.fromMap(doc.data()))
          .toList();

      print('Bulunan hizmet sağlayıcı sayısı: ${providers.length}');

      // Her sağlayıcının çalışma saatlerini al
      final workingHoursPromises = providers.map((provider) async {
        print('${provider.businessName} için çalışma saatleri yükleniyor...');
        try {
          final workingHoursSnapshot = await FirebaseFirestore.instance
              .collection('working_hours')
              .where('providerId', isEqualTo: provider.id)
              .get();

          print('${provider.businessName} için Firestore\'dan gelen veri sayısı: ${workingHoursSnapshot.docs.length}');
          
          final hours = workingHoursSnapshot.docs.map((doc) {
            try {
              final data = doc.data();
              print('${provider.businessName} için çalışma saati verisi: $data');
              return WorkingHoursModel.fromMap(data);
            } catch (e) {
              print('${provider.businessName} için çalışma saati dönüştürme hatası: $e');
              return null;
            }
          }).where((model) => model != null).cast<WorkingHoursModel>().toList();
          
          print('${provider.businessName} için başarıyla dönüştürülen çalışma saati sayısı: ${hours.length}');
          return hours;
        } catch (e) {
          print('${provider.businessName} için çalışma saatleri yüklenirken hata: $e');
          return <WorkingHoursModel>[];
        }
      });

      final allWorkingHours = await Future.wait(workingHoursPromises);
      final validWorkingHours = allWorkingHours.expand((hours) => hours).toList();

      print('Toplam geçerli çalışma saati sayısı: ${validWorkingHours.length}');

      setState(() {
        _providers = providers;
        _workingHours = validWorkingHours;
        _isLoading = false;
      });
    } catch (e) {
      print('Hizmet sağlayıcılar yüklenirken hata: $e');
      setState(() {
        _error = 'Hizmet sağlayıcılar yüklenemedi: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadAvailableTimeSlots() async {
    if (_selectedProvider == null) return;

    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      print('Müsait zaman dilimleri yükleniyor...');
      print('Seçili sağlayıcı: ${_selectedProvider!.businessName}');

      _dateTimeSlots.clear();

      // Sadece mevcut sayfadaki günler için slotları hesapla
      final startIndex = _currentPage * _daysPerPage;
      final endIndex = (startIndex + _daysPerPage > _availableDates.length)
          ? _availableDates.length
          : startIndex + _daysPerPage;
      final pageDates = _availableDates.sublist(startIndex, endIndex);

      for (final date in pageDates) {
        final dayOfWeek = date.weekday;
        print('${DateFormat('dd/MM/yyyy').format(date)} için çalışma saatleri kontrol ediliyor...');
        
        final providerWorkingHours = _workingHours
            .where((hours) =>
                hours.providerId == _selectedProvider!.id &&
                hours.dayOfWeek == dayOfWeek &&
                hours.isActive)
            .toList();

        print('${DateFormat('dd/MM/yyyy').format(date)} için bulunan çalışma saati sayısı: ${providerWorkingHours.length}');

        if (providerWorkingHours.isEmpty) continue;

        // Mevcut randevuları al
        final appointmentsSnapshot = await FirebaseFirestore.instance
            .collection('appointments')
            .where('providerId', isEqualTo: _selectedProvider!.id)
            .where('startTime', isGreaterThanOrEqualTo: Timestamp.fromDate(date))
            .where('startTime', isLessThan: Timestamp.fromDate(date.add(const Duration(days: 1))))
            .get();

        final existingAppointments = appointmentsSnapshot.docs
            .map((doc) => AppointmentModel.fromMap(doc.data()))
            .toList();

        print('${DateFormat('dd/MM/yyyy').format(date)} için mevcut randevu sayısı: ${existingAppointments.length}');

        // Tüm zaman dilimlerini hesapla
        final allTimeSlots = <TimeOfDay>[];
        
        for (final workingHours in providerWorkingHours) {
          final start = workingHours.getStartTime();
          final end = workingHours.getEndTime();
          
          if (start == null || end == null) continue;
          
          var currentTime = start;
          while (currentTime.hour < end.hour || 
                 (currentTime.hour == end.hour && currentTime.minute <= end.minute)) {
            allTimeSlots.add(currentTime);
            currentTime = _addMinutes(currentTime, 30);
          }
        }

        if (allTimeSlots.isNotEmpty) {
          _dateTimeSlots[date] = allTimeSlots;
        }
      }

      print('Toplam tarih sayısı: ${_dateTimeSlots.length}');

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Müsait zaman dilimleri yüklenirken hata: $e');
      setState(() {
        _error = 'Müsait zaman dilimleri yüklenemedi: $e';
        _isLoading = false;
      });
    }
  }

  TimeOfDay _addMinutes(TimeOfDay time, int minutes) {
    final totalMinutes = time.hour * 60 + time.minute + minutes;
    final hour = (totalMinutes ~/ 60) % 24;
    final minute = totalMinutes % 60;
    return TimeOfDay(hour: hour, minute: minute);
  }

  Future<bool> _isTimeSlotAvailable(DateTime date, TimeOfDay time) async {
    final dayOfWeek = date.weekday;
    final providerWorkingHours = _workingHours
        .where((hours) =>
            hours.providerId == _selectedProvider!.id &&
            hours.dayOfWeek == dayOfWeek &&
            hours.isActive)
        .toList();

    if (providerWorkingHours.isEmpty) return false;

    // Çalışma saatleri içinde mi kontrol et
    bool isWithinWorkingHours = false;
    for (final workingHours in providerWorkingHours) {
      final workStart = workingHours.getStartTime();
      final workEnd = workingHours.getEndTime();
      
      if (workStart == null || workEnd == null) continue;
      
      final slotStart = TimeOfDay(hour: time.hour, minute: time.minute);
      final slotEnd = _addMinutes(slotStart, _selectedService!.duration);
      
      if (slotStart.hour >= workStart.hour && 
          (slotEnd.hour < workEnd.hour || 
           (slotEnd.hour == workEnd.hour && slotEnd.minute <= workEnd.minute))) {
        isWithinWorkingHours = true;
        break;
      }
    }

    if (!isWithinWorkingHours) return false;

    // Mevcut randevularla çakışma kontrolü
    final startTime = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    final endTime = startTime.add(Duration(minutes: _selectedService!.duration));

    // Firestore'dan o gün için randevuları al
    final appointmentsSnapshot = await FirebaseFirestore.instance
        .collection('appointments')
        .where('providerId', isEqualTo: _selectedProvider!.id)
        .where('startTime', isGreaterThanOrEqualTo: Timestamp.fromDate(date))
        .where('startTime', isLessThan: Timestamp.fromDate(date.add(const Duration(days: 1))))
        .get();

    final appointments = appointmentsSnapshot.docs
        .map((doc) => AppointmentModel.fromMap(doc.data()))
        .toList();

    // Randevu çakışması kontrolü
    for (final appointment in appointments) {
      final appStart = appointment.startTime;
      final appEnd = appointment.endTime;

      // Çakışma kontrolü
      if ((startTime.isBefore(appEnd) && endTime.isAfter(appStart))) {
        return false;
      }
    }
    return true;
  }

  Future<void> _createAppointment() async {
    if (_selectedService == null ||
        _selectedProvider == null ||
        _selectedDate == null ||
        _selectedTime == null) {
      setState(() {
        _error = 'Lütfen tüm alanları doldurun';
      });
      return;
    }

    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) {
        throw Exception('Kullanıcı bulunamadı');
      }

      final startTime = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        _selectedTime!.hour,
        _selectedTime!.minute,
      );

      final endTime = startTime.add(Duration(minutes: _selectedService!.duration));

      final appointment = AppointmentModel(
        id: '',
        customerId: user.id,
        providerId: _selectedProvider!.id,
        serviceId: _selectedService!.id,
        startTime: startTime,
        endTime: endTime,
        status: AppointmentStatus.pending,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        notes: _noteController.text.isNotEmpty ? _noteController.text : null,
        workingHours: WorkingHoursModel(
          id: '',
          providerId: _selectedProvider!.id,
          dayOfWeek: startTime.weekday,
          startTime: '${startTime.hour}:${startTime.minute}',
          endTime: '${endTime.hour}:${endTime.minute}',
          isActive: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );

      await FirebaseFirestore.instance
          .collection('appointments')
          .add(appointment.toMap());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Randevu başarıyla oluşturuldu'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // Yenileme için true döndür
      }
    } catch (e) {
      setState(() {
        _error = 'Randevu oluşturulamadı: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Randevu Oluştur'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _error = null;
                          });
                          _loadServices();
                        },
                        child: const Text('Tekrar Dene'),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Hizmet Seçimi
                      const Text(
                        'Hizmet Seçin',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<ServiceModel>(
                        value: _selectedService,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                        ),
                        items: _services.map((service) {
                          return DropdownMenuItem(
                            value: service,
                            child: Text(service.name),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedService = value;
                            _selectedProvider = null;
                            _selectedDate = null;
                            _selectedTime = null;
                          });
                          if (value != null) {
                            _loadProvidersForService();
                          }
                        },
                      ),
                      const SizedBox(height: 24),

                      // Hizmet Sağlayıcı Seçimi
                      if (_selectedService != null) ...[
                        const Text(
                          'Hizmet Sağlayıcı Seçin',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<UserModel>(
                          value: _selectedProvider,
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                          ),
                          items: _providers.map((provider) {
                            return DropdownMenuItem(
                              value: provider,
                              child: Text(provider.businessName ?? provider.name),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedProvider = value;
                              _selectedDate = null;
                              _selectedTime = null;
                            });
                            if (value != null) {
                              _loadAvailableTimeSlots();
                            }
                          },
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Tarih ve Saat Seçimi
                      if (_selectedProvider != null && _dateTimeSlots.isNotEmpty) ...[
                        const Text(
                          'Tarih ve Saat Seçin',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Column(
                            children: [
                              // Sayfa Navigasyonu
                              Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.chevron_left),
                                      onPressed: _currentPage > 0 ? _previousPage : null,
                                    ),
                                    Text(
                                      'Sayfa ${_currentPage + 1}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.chevron_right),
                                      onPressed: (_currentPage + 1) * _daysPerPage < _totalDays
                                          ? _nextPage
                                          : null,
                                    ),
                                  ],
                                ),
                              ),
                              // Tarih Sütunları
                              for (var i = 0; i < _dateTimeSlots.length; i += 3)
                                Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                                  child: Row(
                                    children: [
                                      for (var j = 0; j < 3 && i + j < _dateTimeSlots.length; j++)
                                        Expanded(
                                          child: _buildDateColumn(
                                            _dateTimeSlots.keys.elementAt(i + j),
                                            _dateTimeSlots.values.elementAt(i + j),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Randevu Oluştur Butonu
                      if (_selectedTime != null)
                        ElevatedButton(
                          onPressed: _createAppointment,
                          child: const Text('Randevu Oluştur'),
                        ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildDateColumn(DateTime date, List<TimeOfDay> slots) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
            ),
            child: Center(
              child: Text(
                DateFormat('dd/MM/yyyy').format(date),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          FutureBuilder<List<bool>>(
            future: Future.wait(
              slots.map((time) => _isTimeSlotAvailable(date, time))
            ),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const CircularProgressIndicator();
              }
              
              final availabilityList = snapshot.data ?? List.filled(slots.length, false);
              
              return Wrap(
                spacing: 4,
                runSpacing: 4,
                alignment: WrapAlignment.center,
                children: slots.asMap().entries.map((entry) {
                  final index = entry.key;
                  final time = entry.value;
                  final isSelected = _selectedDate == date && _selectedTime == time;
                  final isAvailable = availabilityList[index];
                  
                  return InkWell(
                    onTap: isAvailable ? () {
                      setState(() {
                        _selectedDate = date;
                        _selectedTime = time;
                      });
                    } : null,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? Colors.blue
                            : isAvailable
                                ? Colors.green
                                : Colors.red,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        time.format(context),
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.black,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
} 