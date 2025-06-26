import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:appointment_app/providers/auth_provider.dart';
import 'package:appointment_app/providers/language_provider.dart';
import 'package:appointment_app/providers/theme_provider.dart';
import 'package:appointment_app/widgets/theme_switcher.dart';
import 'package:appointment_app/theme/app_theme.dart';

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

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
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
            leading: IconButton(
              icon: Icon(Icons.arrow_back,
                  color: theme.colorScheme.surface, size: 28),
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
                    _buildHeader(context, languageProvider),
                    const SizedBox(height: AppTheme.spacing40),
                    _buildLoginForm(context, languageProvider),
                    const SizedBox(height: AppTheme.spacing32),
                    _buildAdditionalActions(context, languageProvider),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, LanguageProvider languageProvider) {
    final theme = Theme.of(context);

    return Column(
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
          ),
        ),
        const SizedBox(height: AppTheme.spacing8),
        Text(
          languageProvider.translate('login_subtitle',
              fallback: 'Hesabınıza giriş yapın'),
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.surface.withOpacity(0.8),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildLoginForm(
      BuildContext context, LanguageProvider languageProvider) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing24),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.radius20),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(
                labelText:
                    languageProvider.translate('email', fallback: 'E-posta'),
                hintText: languageProvider.translate('email_hint',
                    fallback: 'ornek@email.com'),
                prefixIcon: Icon(
                  Icons.email_outlined,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
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
            TextFormField(
              controller: _passwordController,
              obscureText: !_passwordVisible,
              textInputAction: TextInputAction.done,
              decoration: InputDecoration(
                labelText:
                    languageProvider.translate('password', fallback: 'Şifre'),
                hintText: languageProvider.translate('password_hint',
                    fallback: 'Şifrenizi girin'),
                prefixIcon: Icon(
                  Icons.lock_outlined,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                suffixIcon: IconButton(
                  icon: Icon(
                    _passwordVisible ? Icons.visibility : Icons.visibility_off,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  onPressed: () {
                    setState(() {
                      _passwordVisible = !_passwordVisible;
                    });
                  },
                ),
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
            SizedBox(
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _login,
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                  elevation: AppTheme.elevation4,
                  shadowColor: theme.colorScheme.shadow.withOpacity(0.3),
                ),
                child: _isLoading
                    ? SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            theme.colorScheme.onPrimary,
                          ),
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.login, size: 24),
                          const SizedBox(width: AppTheme.spacing12),
                          Text(
                            languageProvider.translate('login',
                                fallback: 'Giriş Yap'),
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdditionalActions(
      BuildContext context, LanguageProvider languageProvider) {
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
              fontWeight: FontWeight.w500,
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
        OutlinedButton.icon(
          onPressed: () => context.go('/'),
          icon: const Icon(Icons.home_outlined, size: 20),
          label: Text(
            languageProvider.translate('back_to_home',
                fallback: 'Ana Sayfaya Dön'),
            style: theme.textTheme.labelLarge,
          ),
          style: OutlinedButton.styleFrom(
            foregroundColor: theme.colorScheme.surface,
            side: BorderSide(
              color: theme.colorScheme.surface.withOpacity(0.5),
              width: 1,
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacing24,
              vertical: AppTheme.spacing12,
            ),
          ),
        ),
      ],
    );
  }
}
