import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../services/api_service.dart';

class ProviderDashboardPage extends StatefulWidget {
  const ProviderDashboardPage({super.key});

  @override
  State<ProviderDashboardPage> createState() => _ProviderDashboardPageState();
}

class _ProviderDashboardPageState extends State<ProviderDashboardPage>
    with TickerProviderStateMixin {
  Map<String, dynamic> _dashboardData = {};
  Map<String, dynamic> _aiInsights = {};
  List<Map<String, dynamic>> _todayAppointments = [];
  List<Map<String, dynamic>> _aiRecommendations = [];

  bool _isLoading = true;
  bool _showAIChatbot = false;
  String get _currentUserId {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    return authProvider.currentUser?.id ?? 'provider-123';
  }

  late AnimationController _fadeController;
  late AnimationController _slideController;
  late AnimationController _pulseController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _pulseAnimation;

  Timer? _dataRefreshTimer;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _loadDashboardData();
    _startDataRefreshTimer();
  }

  void _initializeAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.5),
      end: Offset.zero,
    ).animate(
        CurvedAnimation(parent: _slideController, curve: Curves.elasticOut));
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _fadeController.forward();
    _slideController.forward();
    _pulseController.repeat(reverse: true);
  }

  void _startDataRefreshTimer() {
    _dataRefreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _loadDashboardData();
    });
  }

  Future<void> _loadDashboardData() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // Paralel olarak tüm verileri yükle
      await Future.wait([
        _loadPersonalizedDashboard(),
        _loadAIInsights(),
        _loadTodayAppointments(),
        _loadAIRecommendations(),
      ]);

      await _logBehavior('dashboard_view');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Veriler yüklenirken hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadPersonalizedDashboard() async {
    try {
      final response = await http.get(
        Uri.parse(
            'http://127.0.0.1:5001/ai/personalized-dashboard/$_currentUserId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200 && mounted) {
        final data = json.decode(response.body);
        setState(() {
          _dashboardData = data;
        });
      }
    } catch (e) {
      debugPrint('Dashboard data yükleme hatası: $e');
      _setMockDashboardData();
    }
  }

  Future<void> _loadAIInsights() async {
    try {
      final response = await http.get(
        Uri.parse('http://127.0.0.1:5001/ai/customer-insights/$_currentUserId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200 && mounted) {
        final data = json.decode(response.body);
        setState(() {
          _aiInsights = data;
        });
      }
    } catch (e) {
      debugPrint('AI insights yükleme hatası: $e');
      _setMockAIInsights();
    }
  }

  Future<void> _loadTodayAppointments() async {
    try {
      final allAppointments = await ApiService.getAppointments();
      final appointmentsList =
          allAppointments['appointments'] as List<dynamic>? ?? [];

      final today = DateTime.now();
      final todayStart = DateTime(today.year, today.month, today.day);
      final todayEnd = todayStart.add(const Duration(days: 1));

      final todayAppointments =
          appointmentsList.cast<Map<String, dynamic>>().where((appointment) {
        try {
          final appointmentDate = DateTime.parse(appointment['date_time']);
          return appointmentDate.isAfter(todayStart) &&
              appointmentDate.isBefore(todayEnd);
        } catch (e) {
          return false;
        }
      }).toList();

      if (mounted) {
        setState(() {
          _todayAppointments = todayAppointments.take(5).toList();
        });
      }
    } catch (e) {
      debugPrint('Bugünkü randevular yükleme hatası: $e');
    }
  }

  Future<void> _loadAIRecommendations() async {
    try {
      final response = await http.get(
        Uri.parse('http://127.0.0.1:5001/ai/recommendations/$_currentUserId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200 && mounted) {
        final data = json.decode(response.body);
        setState(() {
          _aiRecommendations =
              List<Map<String, dynamic>>.from(data['recommendations'] ?? []);
        });
      }
    } catch (e) {
      debugPrint('AI recommendations yükleme hatası: $e');
      _setMockRecommendations();
    }
  }

  Future<void> _logBehavior(String action) async {
    try {
      await http.post(
        Uri.parse('http://127.0.0.1:5001/ai/log-behavior'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'user_id': _currentUserId,
          'action': action,
          'timestamp': DateTime.now().toIso8601String(),
          'context': {'page': 'provider_dashboard'},
        }),
      );
    } catch (e) {
      debugPrint('Behavior log hatası: $e');
    }
  }

  void _setMockDashboardData() {
    setState(() {
      _dashboardData = {
        'welcome_message': 'AI Destekli Provider Dashboard\'a Hoş Geldiniz!',
        'loyalty_level': 'Professional',
        'efficiency_score': 92,
        'patient_satisfaction': 4.7,
        'monthly_revenue': 15750,
        'appointments_this_week': 28,
        'pending_approvals': 3,
      };
    });
  }

  void _setMockAIInsights() {
    setState(() {
      _aiInsights = {
        'satisfaction_prediction': 0.94,
        'revenue_trend': 'increasing',
        'optimal_schedule': 'morning_heavy',
        'patient_retention': 0.89,
        'efficiency_insights': [
          'Sabah randevuları %23 daha verimli',
          'Hafta sonu randevular artan talep',
          'Hasta memnuniyeti son 2 ayda %15 artış'
        ]
      };
    });
  }

  void _setMockRecommendations() {
    setState(() {
      _aiRecommendations = [
        {
          'type': 'schedule_optimization',
          'title': 'Çalışma Saati Optimizasyonu',
          'description': 'Sabah 09:00-12:00 arası randevu kapasitesini artırın',
          'impact': 'high',
          'confidence': 0.87
        },
        {
          'type': 'service_expansion',
          'title': 'Hizmet Genişletme',
          'description': 'Konsultasyon hizmetine olan talep artıyor',
          'impact': 'medium',
          'confidence': 0.73
        },
        {
          'type': 'patient_communication',
          'title': 'Hasta İletişimi',
          'description': 'Randevu öncesi hatırlatma sistemini aktifleştirin',
          'impact': 'medium',
          'confidence': 0.81
        }
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<LanguageProvider, AuthProvider>(
      builder: (context, languageProvider, authProvider, child) {
        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: _buildAppBar(languageProvider, context),
          body: _isLoading
              ? _buildLoadingScreen()
              : _buildDashboardContent(languageProvider),
          floatingActionButton: _buildAIAssistantFAB(),
        );
      },
    );
  }

  PreferredSizeWidget _buildAppBar(
      LanguageProvider languageProvider, BuildContext context) {
    return AppBar(
      title: const Text(
        'Provider Command Center',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 20,
        ),
      ),
      backgroundColor: Colors.transparent,
      elevation: 0,
      foregroundColor: Colors.white,
      actions: [
        AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: _pulseAnimation.value,
              child: IconButton(
                onPressed: _loadDashboardData,
                icon: const Icon(Icons.refresh),
                tooltip: 'Verileri Yenile',
              ),
            );
          },
        ),
        IconButton(
          onPressed: () async {
            final authProvider =
                Provider.of<AuthProvider>(context, listen: false);
            final confirmed = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Çıkış Yap'),
                content:
                    const Text('Çıkış yapmak istediğinizden emin misiniz?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('İptal'),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style:
                        ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    child: const Text('Çıkış Yap',
                        style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            );

            if (confirmed == true) {
              await authProvider.signOut();
              if (context.mounted) {
                context.go('/login');
              }
            }
          },
          icon: const Icon(Icons.logout),
          tooltip: 'Çıkış Yap',
        ),
      ],
    );
  }

  Widget _buildLoadingScreen() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF667eea),
            Color(0xFF764ba2),
            Color(0xFF6B73FF),
          ],
        ),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Colors.white),
            SizedBox(height: 20),
            Text(
              'AI destekli verileriniz yükleniyor...',
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardContent(LanguageProvider languageProvider) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF667eea),
            Color(0xFF764ba2),
            Color(0xFF6B73FF),
          ],
        ),
      ),
      child: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Professional Welcome Card
                SlideTransition(
                  position: _slideAnimation,
                  child: _buildProfessionalWelcomeCard(),
                ),
                const SizedBox(height: 20),

                // AI Provider Insights
                SlideTransition(
                  position: _slideAnimation,
                  child: _buildAIProviderInsights(),
                ),
                const SizedBox(height: 20),

                // Quick Professional Actions
                SlideTransition(
                  position: _slideAnimation,
                  child: _buildQuickProfessionalActions(),
                ),
                const SizedBox(height: 20),

                // Today's Schedule
                SlideTransition(
                  position: _slideAnimation,
                  child: _buildTodaySchedule(),
                ),
                const SizedBox(height: 20),

                // AI Recommendations for Providers
                SlideTransition(
                  position: _slideAnimation,
                  child: _buildAIProviderRecommendations(),
                ),
                const SizedBox(height: 20),

                // Performance Analytics
                SlideTransition(
                  position: _slideAnimation,
                  child: _buildPerformanceAnalytics(),
                ),
                const SizedBox(height: 100), // FAB için space
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfessionalWelcomeCard() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userName = authProvider.currentUser?.name ?? 'Doktor';
    final welcomeMessage = _dashboardData['welcome_message'] ??
        'AI Destekli Provider Dashboard\'a Hoş Geldiniz!';
    final loyaltyLevel = _dashboardData['loyalty_level'] ?? 'Professional';
    final efficiency = _dashboardData['efficiency_score'] ?? 92;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF667eea),
            Color(0xFF764ba2),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: const Icon(
                  Icons.medical_services,
                  color: Colors.white,
                  size: 30,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hoş geldiniz,',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      userName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        loyaltyLevel,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            welcomeMessage,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildWelcomeMetric(
                    'Verimlilik', '$efficiency%', Icons.trending_up),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildWelcomeMetric(
                    'Memnuniyet',
                    '${(_dashboardData['patient_satisfaction'] ?? 4.7).toStringAsFixed(1)}/5',
                    Icons.star),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeMetric(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAIProviderInsights() {
    final satisfaction = _aiInsights['satisfaction_prediction'] ?? 0.94;
    final retention = _aiInsights['patient_retention'] ?? 0.89;
    final insights = _aiInsights['efficiency_insights'] as List<dynamic>? ?? [];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF667eea).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.psychology,
                  color: Color(0xFF667eea),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'AI Provider Insights',
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
                child: _buildInsightMetric(
                  'Hasta Memnuniyeti',
                  '${(satisfaction * 100).toInt()}%',
                  Colors.green,
                  Icons.sentiment_very_satisfied,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInsightMetric(
                  'Hasta Bağlılığı',
                  '${(retention * 100).toInt()}%',
                  Colors.blue,
                  Icons.favorite,
                ),
              ),
            ],
          ),
          if (insights.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'AI Öngörüleri:',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF667eea),
              ),
            ),
            const SizedBox(height: 8),
            ...insights.take(3).map((insight) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.lightbulb,
                          size: 16, color: Colors.amber),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          insight.toString(),
                          style:
                              const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _buildInsightMetric(
      String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickProfessionalActions() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.flash_on, color: Colors.orange, size: 24),
              SizedBox(width: 8),
              Text(
                'Hızlı İşlemler',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF667eea),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.8,
            children: [
              _buildQuickActionCard(
                'Randevularım',
                Icons.event_note,
                const Color(0xFF4CAF50),
                () => context.go('/provider/appointments'),
              ),
              _buildQuickActionCard(
                'Çalışma Saatleri',
                Icons.schedule,
                const Color(0xFF2196F3),
                () => context.go('/provider/schedule'),
              ),
              _buildQuickActionCard(
                'Hizmetlerim',
                Icons.medical_services,
                const Color(0xFFFF9800),
                () => context.go('/provider/services'),
              ),
              _buildQuickActionCard(
                'Performans',
                Icons.analytics,
                const Color(0xFF9C27B0),
                () {
                  // Performance sayfası
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard(
      String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, color.withValues(alpha: 0.7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 28),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTodaySchedule() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.today, color: Color(0xFF667eea), size: 24),
              const SizedBox(width: 8),
              const Text(
                'Bugünkü Programım',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF667eea),
                ),
              ),
              const Spacer(),
              Text(
                '${_todayAppointments.length} Randevu',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_todayAppointments.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(
                child: Text(
                  'Bugün için planlanmış randevu yok',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _todayAppointments.length,
              itemBuilder: (context, index) {
                final appointment = _todayAppointments[index];
                return _buildAppointmentItem(appointment);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildAppointmentItem(Map<String, dynamic> appointment) {
    final time =
        DateTime.parse(appointment['date_time']).toString().substring(11, 16);
    final status = appointment['status'] ?? 'pending';
    final customerName = appointment['customer_name'] ?? 'Hasta';
    final serviceName = appointment['service_name'] ?? 'Hizmet';

    Color statusColor;
    switch (status.toLowerCase()) {
      case 'confirmed':
        statusColor = Colors.green;
        break;
      case 'pending':
        statusColor = Colors.orange;
        break;
      case 'cancelled':
        statusColor = Colors.red;
        break;
      default:
        statusColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: statusColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border(
          left: BorderSide(color: statusColor, width: 4),
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.access_time, color: statusColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$time - $customerName',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  serviceName,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              status,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAIProviderRecommendations() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.auto_awesome, color: Color(0xFF667eea), size: 24),
              SizedBox(width: 8),
              Text(
                'AI Önerileri',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF667eea),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_aiRecommendations.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(
                child: Text(
                  'AI önerileri yükleniyor...',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _aiRecommendations.length,
              itemBuilder: (context, index) {
                final recommendation = _aiRecommendations[index];
                return _buildRecommendationItem(recommendation);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildRecommendationItem(Map<String, dynamic> recommendation) {
    final title = recommendation['title'] ?? '';
    final description = recommendation['description'] ?? '';
    final impact = recommendation['impact'] ?? 'medium';
    final confidence = (recommendation['confidence'] ?? 0.5) * 100;

    Color impactColor;
    switch (impact.toLowerCase()) {
      case 'high':
        impactColor = Colors.red;
        break;
      case 'medium':
        impactColor = Colors.orange;
        break;
      case 'low':
        impactColor = Colors.green;
        break;
      default:
        impactColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: impactColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: impactColor.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb, color: impactColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: impactColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${confidence.toInt()}%',
                  style: TextStyle(
                    color: impactColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 12,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceAnalytics() {
    final monthlyRevenue = _dashboardData['monthly_revenue'] ?? 15750;
    final weeklyAppointments = _dashboardData['appointments_this_week'] ?? 28;
    final pendingApprovals = _dashboardData['pending_approvals'] ?? 3;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.trending_up, color: Color(0xFF667eea), size: 24),
              SizedBox(width: 8),
              Text(
                'Performans Özeti',
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
                child: _buildPerformanceMetric(
                  'Bu Ay Gelir',
                  '₺${monthlyRevenue.toString()}',
                  Icons.attach_money,
                  Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPerformanceMetric(
                  'Bu Hafta',
                  '$weeklyAppointments Randevu',
                  Icons.event,
                  Colors.blue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildPerformanceMetric(
                  'Bekleyen',
                  '$pendingApprovals Onay',
                  Icons.pending_actions,
                  Colors.orange,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPerformanceMetric(
                  'Memnuniyet',
                  '4.7/5.0 ⭐',
                  Icons.star,
                  Colors.amber,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceMetric(
      String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          Text(
            label,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAIAssistantFAB() {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _pulseAnimation.value,
          child: FloatingActionButton.extended(
            onPressed: () {
              setState(() {
                _showAIChatbot = !_showAIChatbot;
              });
            },
            backgroundColor: const Color(0xFF667eea),
            icon: const Icon(Icons.smart_toy, color: Colors.white),
            label: const Text(
              'AI Asistan',
              style:
                  TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _pulseController.dispose();
    _dataRefreshTimer?.cancel();
    super.dispose();
  }
}
