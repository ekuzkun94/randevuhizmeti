import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:appointment_app/providers/language_provider.dart';
import 'package:appointment_app/providers/auth_provider.dart';
import 'package:appointment_app/theme/app_theme.dart';
import 'package:appointment_app/widgets/modern_cards.dart';
import 'package:appointment_app/widgets/modern_buttons.dart';
import 'package:http/http.dart' as http;
import 'create_appointment_page.dart';
import 'dart:convert';
import 'dart:async';

class CustomerDashboardPage extends StatefulWidget {
  const CustomerDashboardPage({super.key});

  @override
  State<CustomerDashboardPage> createState() => _CustomerDashboardPageState();
}

class _CustomerDashboardPageState extends State<CustomerDashboardPage>
    with TickerProviderStateMixin {
  // ApiService static methods kullandığı için instance'a gerek yok
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late AnimationController _pulseController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _pulseAnimation;

  Map<String, dynamic>? _dashboardData;
  List<Map<String, dynamic>> _aiRecommendations = [];
  Map<String, dynamic>? _loyaltyInfo;
  List<Map<String, dynamic>> _personalizedOffers = [];
  List<Map<String, dynamic>> _recentAppointments = [];
  bool _isLoading = true;
  String get _currentUserId {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    return authProvider.currentUser?.id ?? 'user123';
  }

  // Chat bot related
  bool _isChatOpen = false;
  final List<Map<String, dynamic>> _chatMessages = [];
  final TextEditingController _chatController = TextEditingController();
  bool _isChatLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _loadDashboardData();
    _startPeriodicUpdates();
  }

  void _initializeAnimations() {
    _fadeController = AnimationController(
      duration: AppTheme.animationSlow,
      vsync: this,
    );

    _slideController = AnimationController(
      duration: AppTheme.animationNormal,
      vsync: this,
    );

    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: _fadeController, curve: AppTheme.animationCurveNormal),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(
        parent: _slideController, curve: AppTheme.animationCurveNormal));

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _fadeController.forward();
    _slideController.forward();
    _pulseController.repeat(reverse: true);
  }

  void _startPeriodicUpdates() {
    // Update dashboard data every 30 seconds
    Timer.periodic(const Duration(seconds: 30), (timer) {
      if (mounted) {
        _loadDashboardData(showLoading: false);
      }
    });
  }

  Future<void> _loadDashboardData({bool showLoading = true}) async {
    if (showLoading) {
      setState(() => _isLoading = true);
    }

    try {
      // Load personalized dashboard
      final response = await http.get(
        Uri.parse(
            'http://127.0.0.1:5001/ai/personalized-dashboard/$_currentUserId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _dashboardData = data['dashboard'];
          _aiRecommendations = List<Map<String, dynamic>>.from(
              data['dashboard']['recommendations']['services'] ?? []);
          _loyaltyInfo = data['dashboard']['loyalty'];
          _personalizedOffers = List<Map<String, dynamic>>.from(
              data['dashboard']['personalized_offers'] ?? []);
          _recentAppointments = List<Map<String, dynamic>>.from(
              data['dashboard']['recent_appointments'] ?? []);
        });

        // Log behavior
        _logBehavior('dashboard_viewed', {
          'timestamp': DateTime.now().toIso8601String(),
          'session_id': 'session123',
        });
      }
    } catch (e) {
      debugPrint('Dashboard data loading error: $e');
    } finally {
      if (showLoading) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _logBehavior(String action, Map<String, dynamic> data) async {
    try {
      await http.post(
        Uri.parse('http://127.0.0.1:5001/ai/log-behavior'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'user_id': _currentUserId,
          'action': action,
          'data': data,
        }),
      );
    } catch (e) {
      debugPrint('Behavior logging error: $e');
    }
  }

  Future<void> _sendChatMessage(String message) async {
    if (message.trim().isEmpty) return;

    setState(() {
      _chatMessages.add({
        'message': message,
        'isUser': true,
        'timestamp': DateTime.now(),
      });
      _isChatLoading = true;
    });

    _chatController.clear();

    try {
      final response = await http.post(
        Uri.parse('http://127.0.0.1:5001/ai/chatbot/$_currentUserId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'message': message,
          'context': {
            'current_screen': 'dashboard',
            'user_preferences': _dashboardData?['user_profile'],
          },
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final aiResponse = data['ai_response'];

        setState(() {
          _chatMessages.add({
            'message': aiResponse['message'] ?? 'Üzgünüm, anlayamadım.',
            'isUser': false,
            'timestamp': DateTime.now(),
            'suggestions': aiResponse['suggestions'],
            'quick_actions': aiResponse['quick_actions'],
          });
        });

        // Log chat interaction
        _logBehavior('chat_interaction', {
          'message': message,
          'intent': aiResponse['intent'],
          'confidence': aiResponse['confidence'],
        });
      }
    } catch (e) {
      debugPrint('Chat error: $e');
      setState(() {
        _chatMessages.add({
          'message': 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
          'isUser': false,
          'timestamp': DateTime.now(),
        });
      });
    } finally {
      setState(() {
        _isChatLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _pulseController.dispose();
    _chatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final languageProvider = Provider.of<LanguageProvider>(context);

    return Scaffold(
      backgroundColor: isDark
          ? AppTheme.darkColorScheme.background
          : AppTheme.lightColorScheme.background,
      appBar: AppBar(
        title: Text(
          languageProvider.translate('dashboard', fallback: 'Dashboard'),
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
        ),
        backgroundColor: isDark
            ? AppTheme.darkColorScheme.surface
            : AppTheme.lightColorScheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              Icons.notifications_outlined,
              color: isDark
                  ? AppTheme.darkColorScheme.onSurface
                  : AppTheme.lightColorScheme.onSurface,
            ),
            onPressed: () {
              // TODO: Implement notifications
            },
          ),
          const SizedBox(width: AppTheme.spacing8),
          PopupMenuButton<String>(
            icon: Icon(
              Icons.more_vert,
              color: isDark
                  ? AppTheme.darkColorScheme.onSurface
                  : AppTheme.lightColorScheme.onSurface,
            ),
            onSelected: (value) {
              switch (value) {
                case 'profile':
                  context.go('/customer/profile');
                  break;
                case 'logout':
                  _showLogoutDialog(context, languageProvider);
                  break;
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem<String>(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(
                      Icons.person_outline,
                      color: isDark
                          ? AppTheme.darkColorScheme.onSurface
                          : AppTheme.lightColorScheme.onSurface,
                      size: 20,
                    ),
                    const SizedBox(width: AppTheme.spacing8),
                    Text(
                      languageProvider.translate('profile', fallback: 'Profil'),
                      style: TextStyle(
                        color: isDark
                            ? AppTheme.darkColorScheme.onSurface
                            : AppTheme.lightColorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuItem<String>(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(
                      Icons.logout,
                      color: isDark
                          ? AppTheme.darkColorScheme.error
                          : AppTheme.lightColorScheme.error,
                      size: 20,
                    ),
                    const SizedBox(width: AppTheme.spacing8),
                    Text(
                      languageProvider.translate('logout',
                          fallback: 'Çıkış Yap'),
                      style: TextStyle(
                        color: isDark
                            ? AppTheme.darkColorScheme.error
                            : AppTheme.lightColorScheme.error,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(width: AppTheme.spacing8),
        ],
      ),
      body: _isLoading
          ? _buildLoadingState(isDark)
          : FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: RefreshIndicator(
                  onRefresh: _loadDashboardData,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(AppTheme.spacing16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildWelcomeSection(context, languageProvider, isDark),
                        const SizedBox(height: AppTheme.spacing24),
                        _buildQuickActions(context, languageProvider, isDark),
                        const SizedBox(height: AppTheme.spacing24),
                        _buildStatsSection(context, languageProvider, isDark),
                        const SizedBox(height: AppTheme.spacing24),
                        _buildRecentAppointments(
                            context, languageProvider, isDark),
                        const SizedBox(height: AppTheme.spacing24),
                        _buildAIRecommendations(
                            context, languageProvider, isDark),
                        const SizedBox(height: AppTheme.spacing24),
                        _buildPersonalizedOffers(
                            context, languageProvider, isDark),
                        const SizedBox(height: AppTheme.spacing24),
                        _buildLoyaltySection(context, languageProvider, isDark),
                        const SizedBox(
                            height:
                                AppTheme.spacing80), // Bottom padding for FAB
                      ],
                    ),
                  ),
                ),
              ),
            ),
      floatingActionButton: _buildChatFAB(context, isDark),
    );
  }

  Widget _buildLoadingState(bool isDark) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ModernUI.glassContainer(
            isDark: isDark,
            padding: const EdgeInsets.all(AppTheme.spacing32),
            child: Column(
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isDark
                        ? AppTheme.darkColorScheme.primary
                        : AppTheme.lightColorScheme.primary,
                  ),
                ),
                const SizedBox(height: AppTheme.spacing16),
                Text(
                  'Dashboard yükleniyor...',
                  style: TextStyle(
                    fontSize: 16,
                    color: isDark
                        ? AppTheme.darkColorScheme.onSurface
                        : AppTheme.lightColorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeSection(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    final theme = Theme.of(context);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userName = authProvider.currentUser?.name ?? 'Kullanıcı';

    return ModernUI.glassContainer(
      isDark: isDark,
      padding: const EdgeInsets.all(AppTheme.spacing24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: AppTheme.primaryGradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Center(
                  child: Text(
                    userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppTheme.spacing16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Merhaba, $userName!',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? AppTheme.darkColorScheme.onSurface
                            : AppTheme.lightColorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacing4),
                    Text(
                      languageProvider.translate('welcome_message',
                          fallback: 'Bugün nasıl yardımcı olabilirim?'),
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark
                            ? AppTheme.darkColorScheme.onSurfaceVariant
                            : AppTheme.lightColorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          languageProvider.translate('quick_actions',
              fallback: 'Hızlı İşlemler'),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing16),
        Row(
          children: [
            Expanded(
              child: ModernButtons.gradientButton(
                text: languageProvider.translate('new_appointment',
                    fallback: 'Yeni Randevu'),
                onPressed: () => context.go('/customer/create-appointment'),
                gradientColors: AppTheme.primaryGradient,
                icon: Icons.add,
                height: 56,
              ),
            ),
            const SizedBox(width: AppTheme.spacing12),
            Expanded(
              child: ModernButtons.glassButton(
                text: languageProvider.translate('my_appointments',
                    fallback: 'Randevularım'),
                onPressed: () => context.go('/customer/my-appointments'),
                isDark: isDark,
                icon: Icons.calendar_today,
                height: 56,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatsSection(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          languageProvider.translate('statistics', fallback: 'İstatistikler'),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing16),
        Row(
          children: [
            Expanded(
              child: ModernCards.gradientCard(
                gradientColors: AppTheme.primaryGradient,
                padding: const EdgeInsets.all(AppTheme.spacing20),
                child: Column(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      color: Colors.white,
                      size: 32,
                    ),
                    const SizedBox(height: AppTheme.spacing8),
                    Text(
                      '${_recentAppointments.length}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      languageProvider.translate('total_appointments',
                          fallback: 'Toplam Randevu'),
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white70,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: AppTheme.spacing12),
            Expanded(
              child: ModernCards.gradientCard(
                gradientColors: AppTheme.secondaryGradient,
                padding: const EdgeInsets.all(AppTheme.spacing20),
                child: Column(
                  children: [
                    Icon(
                      Icons.star,
                      color: Colors.white,
                      size: 32,
                    ),
                    const SizedBox(height: AppTheme.spacing8),
                    Text(
                      '${_loyaltyInfo?['points'] ?? 0}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      languageProvider.translate('loyalty_points',
                          fallback: 'Puan'),
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white70,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecentAppointments(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    if (_recentAppointments.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              languageProvider.translate('recent_appointments',
                  fallback: 'Son Randevular'),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark
                    ? AppTheme.darkColorScheme.onSurface
                    : AppTheme.lightColorScheme.onSurface,
              ),
            ),
            TextButton(
              onPressed: () => context.go('/customer/my-appointments'),
              child: Text(
                languageProvider.translate('view_all', fallback: 'Tümünü Gör'),
                style: TextStyle(
                  color: isDark
                      ? AppTheme.darkColorScheme.primary
                      : AppTheme.lightColorScheme.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppTheme.spacing16),
        ..._recentAppointments.take(3).map(
              (appointment) => Padding(
                padding: const EdgeInsets.only(bottom: AppTheme.spacing12),
                child: ModernCards.glassCard(
                  isDark: isDark,
                  padding: const EdgeInsets.all(AppTheme.spacing16),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          borderRadius:
                              BorderRadius.circular(AppTheme.radius12),
                          color: isDark
                              ? AppTheme.darkColorScheme.primaryContainer
                              : AppTheme.lightColorScheme.primaryContainer,
                        ),
                        child: Icon(
                          Icons.calendar_today,
                          color: isDark
                              ? AppTheme.darkColorScheme.onPrimaryContainer
                              : AppTheme.lightColorScheme.onPrimaryContainer,
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacing12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              appointment['service_name'] ?? 'Randevu',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: isDark
                                    ? AppTheme.darkColorScheme.onSurface
                                    : AppTheme.lightColorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(height: AppTheme.spacing4),
                            Text(
                              appointment['date'] ?? 'Tarih belirtilmemiş',
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark
                                    ? AppTheme.darkColorScheme.onSurfaceVariant
                                    : AppTheme
                                        .lightColorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppTheme.spacing8,
                          vertical: AppTheme.spacing4,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(AppTheme.radius8),
                          color: _getStatusColor(appointment['status'], isDark),
                        ),
                        child: Text(
                          appointment['status'] ?? 'Bilinmiyor',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
      ],
    );
  }

  Widget _buildAIRecommendations(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    if (_aiRecommendations.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          languageProvider.translate('ai_recommendations',
              fallback: 'AI Önerileri'),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing16),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _aiRecommendations.length,
            itemBuilder: (context, index) {
              final recommendation = _aiRecommendations[index];
              return Container(
                width: 200,
                margin: const EdgeInsets.only(right: AppTheme.spacing12),
                child: ModernCards.gradientCard(
                  gradientColors: AppTheme.sunsetGradient,
                  padding: const EdgeInsets.all(AppTheme.spacing16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        recommendation['service_name'] ?? 'Öneri',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacing4),
                      Text(
                        recommendation['reason'] ?? 'Size özel öneri',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white70,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Spacer(),
                      ModernButtons.glassButton(
                        text: languageProvider.translate('book_now',
                            fallback: 'Rezervasyon'),
                        onPressed: () =>
                            context.go('/customer/create-appointment'),
                        isDark: false,
                        icon: Icons.arrow_forward,
                        height: 32,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPersonalizedOffers(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    if (_personalizedOffers.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          languageProvider.translate('personalized_offers',
              fallback: 'Kişiselleştirilmiş Teklifler'),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing16),
        ..._personalizedOffers.map(
          (offer) => Padding(
            padding: const EdgeInsets.only(bottom: AppTheme.spacing12),
            child: ModernCards.glassCard(
              isDark: isDark,
              padding: const EdgeInsets.all(AppTheme.spacing16),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppTheme.radius12),
                      color: isDark
                          ? AppTheme.darkColorScheme.secondaryContainer
                          : AppTheme.lightColorScheme.secondaryContainer,
                    ),
                    child: Icon(
                      Icons.local_offer,
                      color: isDark
                          ? AppTheme.darkColorScheme.onSecondaryContainer
                          : AppTheme.lightColorScheme.onSecondaryContainer,
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacing12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          offer['title'] ?? 'Özel Teklif',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? AppTheme.darkColorScheme.onSurface
                                : AppTheme.lightColorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacing4),
                        Text(
                          offer['description'] ?? 'Açıklama',
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark
                                ? AppTheme.darkColorScheme.onSurfaceVariant
                                : AppTheme.lightColorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spacing8,
                      vertical: AppTheme.spacing4,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppTheme.radius8),
                      color: isDark
                          ? AppTheme.darkColorScheme.primary
                          : AppTheme.lightColorScheme.primary,
                    ),
                    child: Text(
                      '${offer['discount'] ?? 0}%',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoyaltySection(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    if (_loyaltyInfo == null) {
      return const SizedBox.shrink();
    }

    return ModernCards.gradientCard(
      gradientColors: AppTheme.primaryGradient,
      padding: const EdgeInsets.all(AppTheme.spacing24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.star,
                color: Colors.white,
                size: 32,
              ),
              const SizedBox(width: AppTheme.spacing12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      languageProvider.translate('loyalty_program',
                          fallback: 'Sadakat Programı'),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      languageProvider.translate('loyalty_subtitle',
                          fallback: 'Puanlarınızı kullanın'),
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing16),
          Row(
            children: [
              Expanded(
                child: Column(
                  children: [
                    Text(
                      '${_loyaltyInfo!['points'] ?? 0}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      languageProvider.translate('current_points',
                          fallback: 'Mevcut Puan'),
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  children: [
                    Text(
                      '${_loyaltyInfo!['tier'] ?? 'Bronze'}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      languageProvider.translate('current_tier',
                          fallback: 'Mevcut Seviye'),
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
        ],
      ),
    );
  }

  Widget _buildChatFAB(BuildContext context, bool isDark) {
    return FloatingActionButton(
      onPressed: () {
        setState(() {
          _isChatOpen = !_isChatOpen;
        });
      },
      backgroundColor: isDark
          ? AppTheme.darkColorScheme.primary
          : AppTheme.lightColorScheme.primary,
      child: AnimatedRotation(
        turns: _isChatOpen ? 0.125 : 0,
        duration: AppTheme.animationNormal,
        child: Icon(
          _isChatOpen ? Icons.close : Icons.chat,
          color: Colors.white,
        ),
      ),
    );
  }

  Color _getStatusColor(String? status, bool isDark) {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return isDark
            ? AppTheme.darkColorScheme.primary
            : AppTheme.lightColorScheme.primary;
    }
  }

  void _showLogoutDialog(
      BuildContext context, LanguageProvider languageProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          languageProvider.translate('logout_confirmation',
              fallback: 'Çıkış Yapmak İstediğinize Emin Misiniz?'),
        ),
        content: Text(
          languageProvider.translate('logout_message',
              fallback: 'Çıkış yapmak, oturumunuzu sonlandıracaktır.'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              languageProvider.translate('cancel', fallback: 'İptal'),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _logout();
            },
            child: Text(
              languageProvider.translate('logout', fallback: 'Çıkış Yap'),
            ),
          ),
        ],
      ),
    );
  }

  void _logout() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    authProvider.signOut();
    context.go('/login');
  }
}
