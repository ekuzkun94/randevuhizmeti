import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:appointment_app/providers/auth_provider.dart';
import 'dart:convert';
import 'dart:math';

class AIReportsPage extends StatefulWidget {
  const AIReportsPage({super.key});

  @override
  State<AIReportsPage> createState() => _AIReportsPageState();
}

class _AIReportsPageState extends State<AIReportsPage>
    with TickerProviderStateMixin {
  late AnimationController _chartController;
  late AnimationController _fadeController;
  late Animation<double> _chartAnimation;
  late Animation<double> _fadeAnimation;

  Map<String, dynamic>? _reportData;
  bool _isLoading = true;
  String get _currentUserId {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    return authProvider.currentUser?.id ?? 'user123';
  }

  String _selectedPeriod = '6_months';

  final List<Map<String, String>> _periods = [
    {'value': '1_month', 'label': 'Son 1 Ay'},
    {'value': '3_months', 'label': 'Son 3 Ay'},
    {'value': '6_months', 'label': 'Son 6 Ay'},
    {'value': '1_year', 'label': 'Son 1 Yıl'},
    {'value': 'all', 'label': 'Tüm Zamanlar'},
  ];

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _loadReportData();
  }

  void _initializeAnimations() {
    _chartController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _chartAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _chartController, curve: Curves.easeOutCubic),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );

    _fadeController.forward();
  }

  Future<void> _loadReportData() async {
    setState(() => _isLoading = true);

    try {
      final response = await http.get(
        Uri.parse('http://127.0.0.1:5001/ai/generate-report/$_currentUserId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _reportData = data;
        });
        _chartController.forward();
      }
    } catch (e) {
      debugPrint('Report loading error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _chartController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: _buildAppBar(),
          body: _isLoading ? _buildLoadingScreen() : _buildReportContent(),
        );
      },
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.analytics, size: 20),
          ),
          const SizedBox(width: 12),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'AI Raporlarım',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'Gelişmiş Analitikler',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ],
      ),
      backgroundColor: Colors.transparent,
      elevation: 0,
      flexibleSpace: Container(
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
      ),
      actions: [
        DropdownButton<String>(
          value: _selectedPeriod,
          dropdownColor: const Color(0xFF667eea),
          style: const TextStyle(color: Colors.white),
          underline: Container(),
          icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
          onChanged: (String? newValue) {
            if (newValue != null) {
              setState(() => _selectedPeriod = newValue);
              _loadReportData();
            }
          },
          items: _periods.map<DropdownMenuItem<String>>((period) {
            return DropdownMenuItem<String>(
              value: period['value'],
              child: Text(
                period['label']!,
                style: const TextStyle(color: Colors.white),
              ),
            );
          }).toList(),
        ),
        const SizedBox(width: 16),
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
          ],
        ),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
            SizedBox(height: 20),
            Text(
              'AI Raporunuz Hazırlanıyor...',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportContent() {
    if (_reportData == null) return const SizedBox.shrink();

    return Container(
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
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildReportSummaryCard(),
                const SizedBox(height: 20),
                _buildInsightsCard(),
                const SizedBox(height: 20),
                _buildTrendsChart(),
                const SizedBox(height: 20),
                _buildTopServicesCard(),
                const SizedBox(height: 20),
                _buildPreferredProvidersCard(),
                const SizedBox(height: 20),
                _buildPredictionsCard(),
                const SizedBox(height: 20),
                _buildAdvancedMetricsCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReportSummaryCard() {
    final reportPeriod = _reportData!['report_period'] ?? {};
    final analytics = _reportData!['analytics'] ?? {};

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            Color(0xFFF8F9FF),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.summarize,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Rapor Özeti',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                      Text(
                        'Genel Performans Analizi',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _buildSummaryMetric(
                    'Toplam Randevu',
                    '${reportPeriod['total_appointments'] ?? 0}',
                    Icons.calendar_today,
                    const Color(0xFF4CAF50),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryMetric(
                    'Yaşam Boyu Değer',
                    '₺${((analytics['total_lifetime_value'] as num?) ?? 0.0).toStringAsFixed(0)}',
                    Icons.attach_money,
                    const Color(0xFF2196F3),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildSummaryMetric(
                    'Aylık Ortalama',
                    '${((analytics['average_monthly_visits'] as num?) ?? 0.0).toStringAsFixed(1)}',
                    Icons.trending_up,
                    const Color(0xFFFF9800),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryMetric(
                    'En Çok Kullanılan',
                    _getMostUsedService(),
                    Icons.star,
                    const Color(0xFF9C27B0),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryMetric(
      String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildInsightsCard() {
    final insights = _reportData!['insights'] ?? {};
    final userProfile = insights['customer_profile'] ?? {};

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF6B73FF),
            Color(0xFF9A4FE8),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6B73FF).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.psychology,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI İnsights',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        'Kişiselleştirilmiş Analizler',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildInsightItem(
              'Sadakat Seviyesi',
              userProfile['loyalty_level'] ?? 'Bilinmiyor',
              Icons.loyalty,
            ),
            const SizedBox(height: 12),
            _buildInsightItem(
              'Aktivite Düzeyi',
              userProfile['activity_level'] ?? 'Bilinmiyor',
              Icons.trending_up,
            ),
            const SizedBox(height: 12),
            _buildInsightItem(
              'Tercih Edilen Kategori',
              userProfile['preferred_category'] ?? 'Henüz belirlenmedi',
              Icons.category,
            ),
            const SizedBox(height: 12),
            _buildInsightItem(
              'Randevu Alışkanlığı',
              userProfile['booking_pattern'] ?? 'Analiz ediliyor',
              Icons.schedule,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightItem(String title, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: Colors.white70, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.white70,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTrendsChart() {
    final analytics = _reportData!['analytics'] ?? {};
    final monthlyTrends = (analytics['monthly_trends'] as List?)
            ?.map((item) => item as Map<String, dynamic>)
            .toList() ??
        <Map<String, dynamic>>[];

    if (monthlyTrends.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF667eea).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.show_chart,
                    color: Color(0xFF667eea),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Aylık Trendler',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                      Text(
                        'Randevu ve Harcama Analizi',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 200,
              child: AnimatedBuilder(
                animation: _chartAnimation,
                builder: (context, child) {
                  return CustomPaint(
                    painter: TrendChartPainter(
                      monthlyTrends,
                      _chartAnimation.value,
                    ),
                    size: const Size(double.infinity, 200),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildChartLegend('Randevular', const Color(0xFF667eea)),
                _buildChartLegend('Harcama (₺)', const Color(0xFFE91E63)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChartLegend(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF2D3748),
          ),
        ),
      ],
    );
  }

  Widget _buildTopServicesCard() {
    final analytics = _reportData!['analytics'] ?? {};
    final topServices = analytics['top_services'] ?? {};

    if (topServices.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4CAF50).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.emoji_events,
                    color: Color(0xFF4CAF50),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'En Çok Kullanılan Hizmetler',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                      Text(
                        'Tercih Analizi',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ...topServices.entries.take(5).map((entry) {
              final maxValue =
                  topServices.values.reduce((a, b) => a > b ? a : b).toDouble();
              final percentage = (entry.value.toDouble() / maxValue);

              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            entry.key,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF2D3748),
                            ),
                          ),
                        ),
                        Text(
                          '${entry.value} kez',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF4CAF50),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    AnimatedBuilder(
                      animation: _chartAnimation,
                      builder: (context, child) {
                        return LinearProgressIndicator(
                          value: percentage * _chartAnimation.value,
                          backgroundColor: Colors.grey.shade200,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                              Color(0xFF4CAF50)),
                        );
                      },
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildPreferredProvidersCard() {
    final analytics = _reportData!['analytics'] ?? {};
    final preferredProviders = analytics['preferred_providers'] ?? {};

    if (preferredProviders.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2196F3).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.person_search,
                    color: Color(0xFF2196F3),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tercih Edilen Uzmanlar',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                      Text(
                        'En Çok Çalıştığınız Uzmanlar',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ...preferredProviders.entries.take(3).map((entry) {
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF2196F3).withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF2196F3).withValues(alpha: 0.2),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2196F3).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.person,
                        color: Color(0xFF2196F3),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        entry.key,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2196F3),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${entry.value} randevu',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildPredictionsCard() {
    final predictions = _reportData!['predictions'] ?? {};

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFFD700),
            Color(0xFFFFA500),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFD700).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.psychology,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI Tahminleri',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        'Gelecek Analizi',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _buildPredictionMetric(
                    'Memnuniyet',
                    ((predictions['satisfaction_score'] as num?) ?? 0.0)
                            .toDouble() *
                        100,
                    Icons.sentiment_very_satisfied,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildPredictionMetric(
                    'Sadakat',
                    ((predictions['next_visit_probability'] as num?) ?? 0.0)
                            .toDouble() *
                        100,
                    Icons.favorite,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lightbulb, color: Colors.white, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'AI Önerisi',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          _getAISuggestion(predictions),
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.white70,
                          ),
                        ),
                      ],
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

  Widget _buildPredictionMetric(
      String title, double percentage, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 24),
        const SizedBox(height: 8),
        Text(
          '${percentage.toStringAsFixed(0)}%',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  Widget _buildAdvancedMetricsCard() {
    final analytics = _reportData!['analytics'] ?? {};

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF9C27B0).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.speed,
                    color: Color(0xFF9C27B0),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Gelişmiş Metrikler',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                      Text(
                        'Detaylı İstatistikler',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.5,
              children: [
                _buildMetricCard(
                  'Yaşam Boyu Değer',
                  '₺${((analytics['total_lifetime_value'] as num?) ?? 0.0).toStringAsFixed(0)}',
                  Icons.monetization_on,
                  const Color(0xFF4CAF50),
                ),
                _buildMetricCard(
                  'Aylık Ortalama',
                  '${((analytics['average_monthly_visits'] as num?) ?? 0.0).toStringAsFixed(1)}',
                  Icons.calendar_view_month,
                  const Color(0xFF2196F3),
                ),
                _buildMetricCard(
                  'Hizmet Çeşitliliği',
                  '${(analytics['top_services'] as Map?)?.length ?? 0}',
                  Icons.category,
                  const Color(0xFFFF9800),
                ),
                _buildMetricCard(
                  'Uzman Sayısı',
                  '${(analytics['preferred_providers'] as Map?)?.length ?? 0}',
                  Icons.group,
                  const Color(0xFF9C27B0),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(
      String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  String _getMostUsedService() {
    final analytics = _reportData!['analytics'] ?? {};
    final topServices = analytics['top_services'] ?? {};

    if (topServices.isEmpty) return 'Henüz yok';

    return topServices.keys.first.toString();
  }

  String _getAISuggestion(dynamic predictions) {
    final predMap = predictions is Map ? predictions : {};
    final satisfaction =
        ((predMap['satisfaction_score'] as num?) ?? 0.0).toDouble() * 100;
    final retention =
        ((predMap['next_visit_probability'] as num?) ?? 0.0).toDouble() * 100;

    if (satisfaction > 90 && retention > 85) {
      return 'Mükemmel performans! Mevcut hizmet kalitesini sürdürün.';
    } else if (satisfaction > 80) {
      return 'İyi durumdayız! Daha düzenli randevular alarak deneyiminizi artırabilirsiniz.';
    } else if (retention < 70) {
      return 'Yeni hizmetleri deneyerek deneyiminizi zenginleştirebilirsiniz.';
    } else {
      return 'Tercih ettiğiniz uzmanlarla daha sık görüşmeyi düşünün.';
    }
  }
}

class TrendChartPainter extends CustomPainter {
  final List<Map<String, dynamic>> data;
  final double animationValue;

  TrendChartPainter(this.data, this.animationValue);

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    final appointmentPaint = Paint()
      ..color = const Color(0xFF667eea)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final spendingPaint = Paint()
      ..color = const Color(0xFFE91E63)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final pointPaint = Paint()..style = PaintingStyle.fill;

    // Calculate max values for scaling - Safe casting
    double maxAppointments = data
        .map((d) => ((d['appointments'] as num?) ?? 0).toDouble())
        .reduce(max);
    double maxSpending =
        data.map((d) => ((d['spending'] as num?) ?? 0).toDouble()).reduce(max);

    if (maxAppointments == 0) maxAppointments = 1;
    if (maxSpending == 0) maxSpending = 1;

    // Draw appointment line
    final appointmentPath = Path();
    final spendingPath = Path();

    for (int i = 0; i < data.length; i++) {
      final x = (size.width / (data.length - 1)) * i * animationValue;

      // Safe casting for chart values
      final appointmentValue =
          ((data[i]['appointments'] as num?) ?? 0).toDouble();
      final spendingValue = ((data[i]['spending'] as num?) ?? 0).toDouble();

      final appointmentY =
          size.height - (appointmentValue / maxAppointments * size.height);
      final spendingY =
          size.height - (spendingValue / maxSpending * size.height);

      if (i == 0) {
        appointmentPath.moveTo(x, appointmentY);
        spendingPath.moveTo(x, spendingY);
      } else {
        appointmentPath.lineTo(x, appointmentY);
        spendingPath.lineTo(x, spendingY);
      }

      // Draw points
      pointPaint.color = const Color(0xFF667eea);
      canvas.drawCircle(Offset(x, appointmentY), 4, pointPaint);

      pointPaint.color = const Color(0xFFE91E63);
      canvas.drawCircle(Offset(x, spendingY), 4, pointPaint);
    }

    canvas.drawPath(appointmentPath, appointmentPaint);
    canvas.drawPath(spendingPath, spendingPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
