import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:appointment_app/providers/auth_provider.dart';
import 'package:appointment_app/providers/language_provider.dart';
import 'package:appointment_app/providers/theme_provider.dart';
import 'package:appointment_app/widgets/theme_switcher.dart';
import 'package:appointment_app/theme/app_theme.dart';
import 'package:appointment_app/widgets/modern_buttons.dart';
import 'package:appointment_app/widgets/modern_inputs.dart';
import 'package:appointment_app/services/hybrid_api_service.dart';
import 'package:appointment_app/router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'package:appointment_app/l10n/app_localizations.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _passwordVisible = false;
  bool _apiAvailable = false;
  int _failedAttempts = 0;
  DateTime? _lockoutEndTime;
  static const int maxAttempts = 5;
  static const Duration lockoutDuration = Duration(seconds: 10);
  static const String _prefsFailedAttempts = 'login_failed_attempts';
  static const String _prefsLockoutEnd = 'login_lockout_end';
  Timer? _lockoutTimer;

  @override
  void initState() {
    super.initState();
    _loadLockoutState();
    _checkApiStatus();
    _startLockoutTimerIfNeeded();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _lockoutTimer?.cancel();
    super.dispose();
  }

  void _startLockoutTimerIfNeeded() {
    _lockoutTimer?.cancel();
    if (_isLockedOut) {
      _lockoutTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (!_isLockedOut) {
          timer.cancel();
        } else {
          setState(() {}); // Sayaç güncellensin
        }
      });
    }
  }

  Future<void> _loadLockoutState() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _failedAttempts = prefs.getInt(_prefsFailedAttempts) ?? 0;
      final lockoutEndMillis = prefs.getInt(_prefsLockoutEnd);
      if (lockoutEndMillis != null) {
        _lockoutEndTime = DateTime.fromMillisecondsSinceEpoch(lockoutEndMillis);
      }
    });
    _startLockoutTimerIfNeeded();
  }

  Future<void> _saveLockoutState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_prefsFailedAttempts, _failedAttempts);
    if (_lockoutEndTime != null) {
      await prefs.setInt(
          _prefsLockoutEnd, _lockoutEndTime!.millisecondsSinceEpoch);
    } else {
      await prefs.remove(_prefsLockoutEnd);
    }
  }

  Future<void> _checkApiStatus() async {
    print('🔍 API durumu kontrol ediliyor...');
    setState(() {
      _isLoading = true;
    });
    try {
      final available = await HybridApiService().checkApiStatus();
      print('🔍 API durumu: $available');
      setState(() {
        _apiAvailable = available;
      });
    } catch (e) {
      print('🔍 API hatası: $e');
      setState(() {
        _apiAvailable = false;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _onLoginFailed() async {
    setState(() {
      _failedAttempts++;
      if (_failedAttempts >= maxAttempts) {
        _lockoutEndTime = DateTime.now().add(lockoutDuration);
      }
    });
    await _saveLockoutState();
    _startLockoutTimerIfNeeded();
  }

  bool get _isLockedOut {
    if (_lockoutEndTime == null) return false;
    if (DateTime.now().isAfter(_lockoutEndTime!)) {
      _resetLockout();
      return false;
    }
    return true;
  }

  void _resetLockout() async {
    setState(() {
      _failedAttempts = 0;
      _lockoutEndTime = null;
    });
    await _saveLockoutState();
    _lockoutTimer?.cancel();
  }

  String get _lockoutMessage {
    if (_lockoutEndTime == null) return '';
    final remaining = _lockoutEndTime!.difference(DateTime.now());
    final min = remaining.inMinutes;
    final sec = remaining.inSeconds % 60;
    return 'Çok fazla başarısız giriş! Lütfen $min dakika $sec saniye bekleyin.';
  }

  Future<void> _login() async {
    if (_isLockedOut) {
      return;
    }
    print('🚀 Login sayfası: Giriş başlatılıyor');

    if (!_formKey.currentState!.validate()) {
      print('🚀 Form validasyonu başarısız!');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final languageProvider =
          Provider.of<LanguageProvider>(context, listen: false);

      final email = _emailController.text.trim();
      final password = _passwordController.text.trim();

      print('🚀 Giriş bilgileri: email=$email, password=$password');

      final success = await authProvider.login(email, password, '');

      print('🚀 Login sonucu: $success');

      if (success && mounted) {
        _resetLockout();
        print('🚀 Login başarılı! Yönlendirme yapılıyor...');
        final user = authProvider.currentUser;
        if (user != null) {
          print('🚀 Kullanıcı rolü: ${user.roleId}');
          switch (user.roleId) {
            case '1': // Admin
              print('🚀 Admin sayfasına yönlendiriliyor...');
              context.go('/admin');
              break;
            case '2': // Provider
              print('🚀 Provider sayfasına yönlendiriliyor...');
              context.go('/provider/dashboard');
              break;
            case '3': // Customer
              print('🚀 Customer sayfasına yönlendiriliyor...');
              context.go('/customer');
              break;
            default:
              print(
                  '🚀 Varsayılan olarak customer sayfasına yönlendiriliyor...');
              context.go('/customer');
          }
        } else {
          print('🚀 Kullanıcı bilgisi null!');
        }
      } else if (mounted) {
        print('🚀 Login başarısız! Hata mesajı gösteriliyor...');
        _onLoginFailed();
        final errorMessage = authProvider.errorMessage ??
            languageProvider.translate('invalid_credentials',
                fallback: 'Geçersiz email veya şifre');

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radius12)),
          ),
        );
      }
    } catch (e) {
      print('🚀 Login hatası: $e');
      if (mounted) {
        final languageProvider =
            Provider.of<LanguageProvider>(context, listen: false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '${languageProvider.translate('login_error', fallback: 'Giriş hatası')}: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radius12)),
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

  @override
  Widget build(BuildContext context) {
    return Consumer2<LanguageProvider, ThemeProvider>(
      builder: (context, languageProvider, themeProvider, child) {
        if (!languageProvider.isInitialized) {
          return Scaffold(
            body: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: AppTheme.primaryGradient,
                ),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'Yükleniyor...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final theme = Theme.of(context);
        final isDark = theme.brightness == Brightness.dark;

        // API bağlantı durumu göstergesi
        Widget apiStatusBanner = Padding(
          padding: const EdgeInsets.only(bottom: 4.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _apiAvailable ? Icons.check_circle : Icons.cancel,
                color: _apiAvailable ? Colors.green : Colors.red,
                size: 18,
              ),
              const SizedBox(width: 6),
              Text(
                _apiAvailable
                    ? 'API bağlantısı başarılı'
                    : 'API bağlantısı yok',
                style: TextStyle(
                  color: _apiAvailable ? Colors.green : Colors.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );

        // Lockout mesajı
        Widget lockoutBanner = _isLockedOut
            ? Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.lock_outline, color: Colors.red, size: 22),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        _lockoutMessage,
                        style: const TextStyle(
                            color: Colors.red,
                            fontSize: 15,
                            fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              )
            : const SizedBox.shrink();

        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: Icon(Icons.arrow_back,
                  color: theme.colorScheme.surface, size: 24),
              onPressed: () => context.go('/'),
              tooltip: 'Ana Sayfaya Dön',
            ),
            actions: [
              QuickThemeToggle(
                size: 40,
                backgroundColor: theme.colorScheme.surface.withOpacity(0.2),
                iconColor: theme.colorScheme.surface,
              ),
              const SizedBox(width: AppTheme.spacing16),
            ],
          ),
          body: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? [
                        const Color(0xFF1A237E),
                        const Color(0xFF311B92),
                        const Color(0xFF4A148C),
                      ]
                    : AppTheme.primaryGradient,
              ),
            ),
            child: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppTheme.spacing24),
                child: Column(
                  children: [
                    apiStatusBanner,
                    lockoutBanner,
                    _buildHeader(context, languageProvider, isDark),
                    const SizedBox(height: AppTheme.spacing40),
                    _buildLoginForm(context, languageProvider, isDark),
                    const SizedBox(height: AppTheme.spacing32),
                    _buildAdditionalActions(context, languageProvider, isDark),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing24),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppTheme.radius16),
        border: Border.all(
          color: theme.colorScheme.surface.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.shadow.withOpacity(0.2),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/images/zamanyonet_logo.png',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Icon(
                    Icons.login,
                    size: 40,
                    color: theme.colorScheme.primary,
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacing24),
          Text(
            languageProvider.translate('login', fallback: 'Giriş Yap'),
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.surface,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: AppTheme.spacing8),
          Text(
            languageProvider.translate('login_subtitle',
                fallback: 'Hesabınıza giriş yapın'),
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.surface.withOpacity(0.8),
              letterSpacing: 0.25,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildLoginForm(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    final theme = Theme.of(context);

    // API bağlantı durumu göstergesi
    Widget apiStatusBanner = Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _apiAvailable ? Icons.check_circle : Icons.cancel,
            color: _apiAvailable ? Colors.green : Colors.red,
            size: 18,
          ),
          const SizedBox(width: 6),
          Text(
            _apiAvailable ? 'API bağlantısı başarılı' : 'API bağlantısı yok',
            style: TextStyle(
              color: _apiAvailable ? Colors.green : Colors.red,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );

    // Lockout mesajı
    Widget lockoutBanner = _isLockedOut
        ? Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline, color: Colors.red, size: 22),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _lockoutMessage,
                    style: const TextStyle(
                        color: Colors.red,
                        fontSize: 15,
                        fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          )
        : const SizedBox.shrink();

    return Column(
      children: [
        // API ve lockout uyarısı e-posta alanının hemen üstünde
        apiStatusBanner,
        lockoutBanner,
        // Login Form
        Container(
          padding: const EdgeInsets.all(24.0),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(16.0),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Email alanı
                ModernInputs.modernTextField(
                  controller: _emailController,
                  label: languageProvider.translate('email'),
                  hint: languageProvider.translate('email_hint',
                      fallback: 'ornek@email.com'),
                  isDark: isDark,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icon(
                    Icons.email_outlined,
                    color: isDark
                        ? AppTheme.darkColorScheme.onSurfaceVariant
                        : AppTheme.lightColorScheme.onSurfaceVariant,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return AppLocalizations.of(context).emailError;
                    }
                    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,63}')
                        .hasMatch(value)) {
                      return AppLocalizations.of(context).invalidEmail;
                    }
                    return null;
                  },
                  isEnabled: !_isLockedOut && !_isLoading,
                ),
                const SizedBox(height: 16),
                // Şifre alanı
                ModernInputs.modernTextField(
                  controller: _passwordController,
                  label: languageProvider.translate('password'),
                  hint: languageProvider.translate('password_hint',
                      fallback: 'Şifrenizi girin'),
                  isDark: isDark,
                  isPassword: !_passwordVisible,
                  prefixIcon: Icon(
                    Icons.lock_outlined,
                    color: isDark
                        ? AppTheme.darkColorScheme.onSurfaceVariant
                        : AppTheme.lightColorScheme.onSurfaceVariant,
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _passwordVisible
                          ? Icons.visibility
                          : Icons.visibility_off,
                      color: isDark
                          ? AppTheme.darkColorScheme.onSurfaceVariant
                          : AppTheme.lightColorScheme.onSurfaceVariant,
                    ),
                    onPressed: () {
                      setState(() {
                        _passwordVisible = !_passwordVisible;
                      });
                    },
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return languageProvider.translate('password_required');
                    }
                    if (value.length < 6) {
                      return languageProvider.translate('password_min_length');
                    }
                    return null;
                  },
                  isEnabled: !_isLockedOut && !_isLoading,
                ),
                const SizedBox(height: 8),
                // Şifremi unuttum linki
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      context.go('/forgot-password');
                    },
                    child: Text(
                      languageProvider.translate('forgot_password'),
                      style: TextStyle(
                        color: theme.primaryColor,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Giriş butonu
                _isLockedOut
                    ? Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.grey[400],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            languageProvider.translate('login'),
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      )
                    : ModernButtons.gradientButton(
                        onPressed: _isLoading ? null : _login,
                        isLoading: _isLoading,
                        text: languageProvider.translate('login'),
                        gradientColors: AppTheme.primaryGradient,
                        icon: Icons.login,
                      ),
                const SizedBox(height: 16),
                // Kayıt ol linki
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      languageProvider.translate('no_account'),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color:
                            theme.textTheme.bodyMedium?.color?.withOpacity(0.7),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        context.go('/register');
                      },
                      child: Text(
                        languageProvider.translate('register'),
                        style: TextStyle(
                          color: theme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        // Test Kullanıcıları Bölümü
        const SizedBox(height: 24),
        _buildTestUsersSection(context, languageProvider, theme),
      ],
    );
  }

  Widget _buildTestUsersSection(BuildContext context,
      LanguageProvider languageProvider, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12.0),
        border: Border.all(
          color: theme.primaryColor.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.person_outline,
                color: theme.primaryColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Test Kullanıcıları',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.primaryColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Test için aşağıdaki kullanıcı bilgilerini kullanabilirsiniz:',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 12),

          // Admin Kullanıcısı
          _buildTestUserCard(
            context,
            theme,
            '👑 Admin',
            'admin@zamanyonet.com',
            '123456',
            Colors.purple,
          ),
          const SizedBox(height: 8),

          // Provider Kullanıcıları
          _buildTestUserCard(
            context,
            theme,
            '🏥 Provider',
            'guzellik@salon.com',
            '123456',
            Colors.blue,
          ),
          const SizedBox(height: 8),
          _buildTestUserCard(
            context,
            theme,
            '🏥 Provider',
            'spa@merkezi.com',
            '123456',
            Colors.blue,
          ),
          const SizedBox(height: 8),
          _buildTestUserCard(
            context,
            theme,
            '🏥 Provider',
            'berber@dukkani.com',
            '123456',
            Colors.blue,
          ),
          const SizedBox(height: 8),

          // Customer Kullanıcıları
          _buildTestUserCard(
            context,
            theme,
            '👤 Customer',
            'musteri1@email.com',
            '123456',
            Colors.green,
          ),
          const SizedBox(height: 8),
          _buildTestUserCard(
            context,
            theme,
            '👤 Customer',
            'musteri2@email.com',
            '123456',
            Colors.green,
          ),
          const SizedBox(height: 8),
          _buildTestUserCard(
            context,
            theme,
            '👤 Customer',
            'musteri3@email.com',
            '123456',
            Colors.green,
          ),
        ],
      ),
    );
  }

  Widget _buildTestUserCard(BuildContext context, ThemeData theme, String title,
      String email, String password, Color color) {
    return Container(
      padding: const EdgeInsets.all(12.0),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.0),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Email: $email',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                  ),
                ),
                Text(
                  'Şifre: $password',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => _fillTestCredentials(email, password),
            style: ElevatedButton.styleFrom(
              backgroundColor: color,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: const Size(0, 36),
            ),
            child: const Text('Kopyala', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  void _fillTestCredentials(String email, String password) {
    setState(() {
      _emailController.text = email;
      _passwordController.text = password;
    });

    // Kullanıcıya bilgi ver
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Test bilgileri dolduruldu: $email'),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Widget _buildAdditionalActions(
      BuildContext context, LanguageProvider languageProvider, bool isDark) {
    final theme = Theme.of(context);

    return Column(
      children: [
        TextButton(
          onPressed: () => context.go('/forgot-password'),
          child: Text(
            languageProvider.translate('forgot_password',
                fallback: 'Şifremi Unuttum'),
            style: theme.textTheme.labelLarge?.copyWith(
              color: theme.colorScheme.surface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: AppTheme.spacing16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              languageProvider.translate('no_account',
                  fallback: 'Hesabınız yok mu?'),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.surface.withOpacity(0.8),
              ),
            ),
            TextButton(
              onPressed: () => context.go('/register'),
              child: Text(
                languageProvider.translate('register', fallback: 'Kayıt Ol'),
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.surface,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppTheme.spacing24),
        ModernButtons.gradientButton(
          text: languageProvider.translate('back_to_home',
              fallback: 'Ana Sayfaya Dön'),
          onPressed: () => context.go('/'),
          gradientColors: AppTheme.primaryGradient,
          icon: Icons.home_outlined,
          padding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacing24,
            vertical: AppTheme.spacing12,
          ),
        ),
      ],
    );
  }
}
