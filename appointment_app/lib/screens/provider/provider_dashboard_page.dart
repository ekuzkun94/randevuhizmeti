import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../services/api_service.dart';

class ProviderDashboardPage extends StatefulWidget {
  const ProviderDashboardPage({super.key});

  @override
  State<ProviderDashboardPage> createState() => _ProviderDashboardPageState();
}

class _ProviderDashboardPageState extends State<ProviderDashboardPage> {
  Map<String, dynamic> _stats = {
    'todayAppointments': 0,
    'weeklyAppointments': 0,
    'monthlyAppointments': 0,
    'totalEarnings': 0.0,
    'weeklyEarnings': 0.0,
    'monthlyEarnings': 0.0,
    'pendingAppointments': 0,
    'confirmedAppointments': 0,
    'cancelledAppointments': 0,
    'averageRating': 0.0,
    'totalReviews': 0,
  };
  
  bool _isLoading = true;
  String _selectedPeriod = 'week'; // week, month, year

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final currentUser = authProvider.currentUser;
      
      if (currentUser != null) {
        final allAppointments = await ApiService.getAppointments();
        
        // Provider'a ait randevuları filtrele
        final appointmentsList = allAppointments['appointments'] as List<dynamic>? ?? [];
        final providerAppointments = appointmentsList.where((appointment) {
          final appointmentMap = appointment as Map<String, dynamic>;
          return appointmentMap['provider_name'] == currentUser.name;
        }).toList().cast<Map<String, dynamic>>();
        
        // İstatistikleri hesapla
        _calculateStats(providerAppointments);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('İstatistikler yüklenirken hata: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _calculateStats(List<Map<String, dynamic>> appointments) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final weekStart = today.subtract(Duration(days: today.weekday - 1));
    final monthStart = DateTime(now.year, now.month, 1);

    int todayCount = 0;
    int weeklyCount = 0;
    int monthlyCount = 0;
    int pendingCount = 0;
    int confirmedCount = 0;
    int cancelledCount = 0;
    double weeklyEarnings = 0.0;
    double monthlyEarnings = 0.0;

    for (var appointment in appointments) {
      try {
        final appointmentDate = DateTime.parse(appointment['date_time']);
        final status = appointment['status']?.toLowerCase() ?? 'pending';
        
        // Tarihe göre sayma
        if (appointmentDate.isAfter(today) && appointmentDate.isBefore(today.add(const Duration(days: 1)))) {
          todayCount++;
        }
        if (appointmentDate.isAfter(weekStart)) {
          weeklyCount++;
          weeklyEarnings += 150.0; // Örnek ücret
        }
        if (appointmentDate.isAfter(monthStart)) {
          monthlyCount++;
          monthlyEarnings += 150.0; // Örnek ücret
        }
        
        // Duruma göre sayma
        switch (status) {
          case 'pending':
            pendingCount++;
            break;
          case 'confirmed':
            confirmedCount++;
            break;
          case 'cancelled':
            cancelledCount++;
            break;
        }
      } catch (e) {
        // Hatalı tarih formatını atla
      }
    }

    setState(() {
      _stats = {
        'todayAppointments': todayCount,
        'weeklyAppointments': weeklyCount,
        'monthlyAppointments': monthlyCount,
        'totalEarnings': monthlyEarnings,
        'weeklyEarnings': weeklyEarnings,
        'monthlyEarnings': monthlyEarnings,
        'pendingAppointments': pendingCount,
        'confirmedAppointments': confirmedCount,
        'cancelledAppointments': cancelledCount,
        'averageRating': 4.5, // Örnek değer
        'totalReviews': 24, // Örnek değer
      };
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: Text(languageProvider.translate('dashboard', fallback: 'Dashboard')),
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadStats,
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
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  )
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Hoş geldiniz kartı
                        _buildWelcomeCard(),
                        const SizedBox(height: 16),
                        
                        // Dönem seçici
                        _buildPeriodSelector(),
                        const SizedBox(height: 16),
                        
                        // Ana istatistikler
                        _buildMainStats(),
                        const SizedBox(height: 16),
                        
                        // Randevu durumları
                        _buildAppointmentStatus(),
                        const SizedBox(height: 16),
                        
                        // Kazanç bilgisi
                        _buildEarningsCard(),
                        const SizedBox(height: 16),
                        
                        // Değerlendirme bilgisi
                        _buildRatingCard(),
                        const SizedBox(height: 16),
                        
                        // Hızlı aksiyonlar
                        _buildQuickActions(),
                      ],
                    ),
                  ),
          ),
        );
      },
    );
  }

  Widget _buildWelcomeCard() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userName = authProvider.currentUser?.name ?? 'Doktor';
    
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: const LinearGradient(
            colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          ),
        ),
        child: Row(
          children: [
            const CircleAvatar(
              radius: 30,
              backgroundColor: Colors.white,
              child: Icon(Icons.person, size: 30, color: Color(0xFF667eea)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Hoş geldiniz,',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    userName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Güncel durumunuz aşağıda gösterilmektedir',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPeriodSelector() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          children: [
            _buildPeriodChip('week', 'Bu Hafta'),
            const SizedBox(width: 8),
            _buildPeriodChip('month', 'Bu Ay'),
            const SizedBox(width: 8),
            _buildPeriodChip('year', 'Bu Yıl'),
          ],
        ),
      ),
    );
  }

  Widget _buildPeriodChip(String value, String label) {
    final isSelected = _selectedPeriod == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedPeriod = value;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF667eea) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : const Color(0xFF667eea),
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMainStats() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Bugün',
            _stats['todayAppointments'].toString(),
            Icons.today,
            Colors.green,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            _selectedPeriod == 'week' ? 'Bu Hafta' : _selectedPeriod == 'month' ? 'Bu Ay' : 'Bu Yıl',
            _selectedPeriod == 'week' 
                ? _stats['weeklyAppointments'].toString()
                : _stats['monthlyAppointments'].toString(),
            Icons.calendar_month,
            Colors.blue,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentStatus() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Randevu Durumları',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF667eea),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatusItem(
                    'Bekleyen',
                    _stats['pendingAppointments'].toString(),
                    Colors.orange,
                  ),
                ),
                Expanded(
                  child: _buildStatusItem(
                    'Onaylanan',
                    _stats['confirmedAppointments'].toString(),
                    Colors.green,
                  ),
                ),
                Expanded(
                  child: _buildStatusItem(
                    'İptal Edilen',
                    _stats['cancelledAppointments'].toString(),
                    Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusItem(String label, String count, Color color) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              count,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildEarningsCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.attach_money, color: Colors.green, size: 24),
                const SizedBox(width: 8),
                const Text(
                  'Kazanç Bilgileri',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF667eea),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bu Hafta',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        '₺${_stats['weeklyEarnings'].toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bu Ay',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        '₺${_stats['monthlyEarnings'].toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.star, color: Colors.amber, size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Değerlendirmeler',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF667eea),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        _stats['averageRating'].toString(),
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '(${_stats['totalReviews']} değerlendirme)',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Hızlı Aksiyonlar',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF667eea),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      context.go('/provider/appointments');
                    },
                    icon: const Icon(Icons.event_note),
                    label: const Text('Randevular'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      context.go('/provider/schedule');
                    },
                    icon: const Icon(Icons.schedule),
                    label: const Text('Çalışma Saatleri'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  context.go('/provider/services');
                },
                icon: const Icon(Icons.medical_services),
                label: const Text('Hizmetlerimi Yönet'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF667eea),
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
} 