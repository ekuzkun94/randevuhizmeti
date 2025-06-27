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

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _passwordVisible = false;

  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: AppTheme.animationSlow,
      vsync: this,
    );
    _slideController = AnimationController(
      duration: AppTheme.animationSlow,
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: AppTheme.animationCurveNormal,
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: AppTheme.animationCurveNormal,
    ));

    _fadeController.forward();
    _slideController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final languageProvider =
          Provider.of<LanguageProvider>(context, listen: false);

      final email = _emailController.text.trim();
      final password = _passwordController.text.trim();

      final success = await authProvider.login(email, password, '');

      if (success && mounted) {
        final user = authProvider.currentUser;
        if (user != null) {
          switch (user.roleId) {
            case '1': // Admin
              context.go('/admin');
              break;
            case '2': // Provider
              context.go('/provider/dashboard');
              break;
            case '3': // Customer
              context.go('/customer');
              break;
            default:
              context.go('/customer');
          }
        }
      } else if (mounted) {
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

        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: ModernUI.glassContainer(
              isDark: isDark,
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              child: IconButton(
                icon: Icon(Icons.arrow_back,
                    color: theme.colorScheme.surface, size: 24),
                onPressed: () => context.go('/'),
                tooltip: 'Ana Sayfaya Dön',
              ),
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
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child: Column(
                      children: [
                        _buildHeader(context, languageProvider, isDark),
                        const SizedBox(height: AppTheme.spacing40),
                        _buildLoginForm(context, languageProvider, isDark),
                        const SizedBox(height: AppTheme.spacing32),
                        _buildAdditionalActions(
                            context, languageProvider, isDark),
                      ],
                    ),
                  ),
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

    return ModernUI.glassContainer(
      isDark: isDark,
      padding: const EdgeInsets.all(AppTheme.spacing24),
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

    return ModernUI.glassContainer(
      isDark: isDark,
      padding: const EdgeInsets.all(AppTheme.spacing24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ModernInputs.modernTextField(
              controller: _emailController,
              label: languageProvider.translate('email', fallback: 'E-posta'),
              hint: languageProvider.translate('email_hint',
                  fallback: 'ornek@email.com'),
              isDark: isDark,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              prefixIcon: Icon(
                Icons.email_outlined,
                color: isDark
                    ? AppTheme.darkColorScheme.onSurfaceVariant
                    : AppTheme.lightColorScheme.onSurfaceVariant,
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return languageProvider.translate('email_required',
                      fallback: 'E-posta gerekli');
                }
                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                    .hasMatch(value)) {
                  return languageProvider.translate('email_invalid',
                      fallback: 'Geçerli bir e-posta girin');
                }
                return null;
              },
            ),
            const SizedBox(height: AppTheme.spacing20),
            ModernInputs.modernTextField(
              controller: _passwordController,
              label: languageProvider.translate('password', fallback: 'Şifre'),
              hint: languageProvider.translate('password_hint',
                  fallback: 'Şifrenizi girin'),
              isDark: isDark,
              isPassword: !_passwordVisible,
              textInputAction: TextInputAction.done,
              prefixIcon: Icon(
                Icons.lock_outlined,
                color: isDark
                    ? AppTheme.darkColorScheme.onSurfaceVariant
                    : AppTheme.lightColorScheme.onSurfaceVariant,
              ),
              suffixIcon: IconButton(
                icon: Icon(
                  _passwordVisible ? Icons.visibility : Icons.visibility_off,
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
                  return languageProvider.translate('password_required',
                      fallback: 'Şifre gerekli');
                }
                if (value.length < 3) {
                  return languageProvider.translate('password_min_length',
                      fallback: 'Şifre en az 3 karakter olmalı');
                }
                return null;
              },
            ),
            const SizedBox(height: AppTheme.spacing24),
            ModernButtons.gradientButton(
              text: languageProvider.translate('login', fallback: 'Giriş Yap'),
              onPressed: _isLoading ? null : () => _login(),
              gradientColors: AppTheme.secondaryGradient,
              icon: Icons.login,
              height: 56,
              isLoading: _isLoading,
            ),
          ],
        ),
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
        ModernButtons.glassButton(
          text: languageProvider.translate('back_to_home',
              fallback: 'Ana Sayfaya Dön'),
          onPressed: () => context.go('/'),
          isDark: isDark,
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
