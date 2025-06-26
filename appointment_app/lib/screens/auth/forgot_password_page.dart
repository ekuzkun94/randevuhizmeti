import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:go_router/go_router.dart';
import '../../providers/language_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/theme_switcher.dart';
import '../../theme/app_theme.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _tokenController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _isTokenSent = false;
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  String? _resetToken;

  @override
  void dispose() {
    _emailController.dispose();
    _tokenController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _sendResetToken() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await http.post(
        Uri.parse('http://localhost:5001/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': _emailController.text.trim(),
        }),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        setState(() {
          _isTokenSent = true;
          _resetToken = data['reset_token']; // Sadece development için
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content:
                  Text(data['message'] ?? 'Şifre sıfırlama kodu gönderildi'),
              backgroundColor: Theme.of(context).colorScheme.primary,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radius12)),
            ),
          );

          // Development için token'ı göster
          if (_resetToken != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Test Token: $_resetToken'),
                duration: const Duration(seconds: 10),
                backgroundColor: Theme.of(context).colorScheme.secondary,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radius12)),
                action: SnackBarAction(
                  label: 'Kopyala',
                  textColor: Theme.of(context).colorScheme.onSecondary,
                  onPressed: () {
                    _tokenController.text = _resetToken!;
                  },
                ),
              ),
            );
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['error'] ?? 'Bir hata oluştu'),
              backgroundColor: Theme.of(context).colorScheme.error,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radius12)),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bağlantı hatası: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radius12)),
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Şifreler eşleşmiyor'),
          backgroundColor: Theme.of(context).colorScheme.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius12)),
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await http.post(
        Uri.parse('http://localhost:5001/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'token': _tokenController.text.trim(),
          'new_password': _passwordController.text,
        }),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'Şifre başarıyla güncellendi'),
              backgroundColor: Theme.of(context).colorScheme.primary,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radius12)),
            ),
          );

          // Giriş sayfasına yönlendir
          context.go('/login');
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['error'] ?? 'Şifre güncellenemedi'),
              backgroundColor: Theme.of(context).colorScheme.error,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radius12)),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bağlantı hatası: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radius12)),
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
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
              onPressed: () => context.go('/login'),
              tooltip: 'Giriş Sayfasına Dön',
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
                    const SizedBox(height: AppTheme.spacing32),
                    _buildResetForm(context, languageProvider),
                    const SizedBox(height: AppTheme.spacing24),
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
            child: Icon(
              Icons.lock_reset,
              size: 40,
              color: theme.colorScheme.primary,
            ),
          ),
        ),
        const SizedBox(height: AppTheme.spacing24),
        Text(
          languageProvider.translate('forgot_password',
              fallback: 'Şifremi Unuttum'),
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.surface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing8),
        Text(
          languageProvider.translate('forgot_password_subtitle',
              fallback: 'Şifrenizi sıfırlamak için e-posta adresinizi girin'),
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.surface.withOpacity(0.8),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildResetForm(
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
            if (!_isTokenSent) ...[
              // Email Field
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.done,
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
              const SizedBox(height: AppTheme.spacing24),

              // Send Token Button
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _sendResetToken,
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
                            const Icon(Icons.send, size: 24),
                            const SizedBox(width: AppTheme.spacing12),
                            Text(
                              languageProvider.translate('send_reset_code',
                                  fallback: 'Sıfırlama Kodu Gönder'),
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ] else ...[
              // Token Field
              TextFormField(
                controller: _tokenController,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: languageProvider.translate('reset_code',
                      fallback: 'Sıfırlama Kodu'),
                  hintText: languageProvider.translate('reset_code_hint',
                      fallback: 'E-posta ile gönderilen kodu girin'),
                  prefixIcon: Icon(
                    Icons.security,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return languageProvider.translate('reset_code_required',
                        fallback: 'Sıfırlama kodu gerekli');
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppTheme.spacing20),

              // New Password Field
              TextFormField(
                controller: _passwordController,
                obscureText: !_isPasswordVisible,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: languageProvider.translate('new_password',
                      fallback: 'Yeni Şifre'),
                  hintText: languageProvider.translate('new_password_hint',
                      fallback: 'Yeni şifrenizi girin'),
                  prefixIcon: Icon(
                    Icons.lock_outlined,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _isPasswordVisible
                          ? Icons.visibility
                          : Icons.visibility_off,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    onPressed: () {
                      setState(() {
                        _isPasswordVisible = !_isPasswordVisible;
                      });
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return languageProvider.translate('new_password_required',
                        fallback: 'Yeni şifre gerekli');
                  }
                  if (value.length < 6) {
                    return languageProvider.translate('password_min_length',
                        fallback: 'Şifre en az 6 karakter olmalı');
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppTheme.spacing20),

              // Confirm Password Field
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: !_isConfirmPasswordVisible,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: languageProvider.translate('confirm_new_password',
                      fallback: 'Yeni Şifre Tekrar'),
                  hintText: languageProvider.translate(
                      'confirm_new_password_hint',
                      fallback: 'Yeni şifrenizi tekrar girin'),
                  prefixIcon: Icon(
                    Icons.lock_outlined,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _isConfirmPasswordVisible
                          ? Icons.visibility
                          : Icons.visibility_off,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    onPressed: () {
                      setState(() {
                        _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                      });
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return languageProvider.translate(
                        'confirm_password_required',
                        fallback: 'Şifre tekrarı gerekli');
                  }
                  if (value != _passwordController.text) {
                    return languageProvider.translate('passwords_not_match',
                        fallback: 'Şifreler eşleşmiyor');
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppTheme.spacing24),

              // Reset Password Button
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _resetPassword,
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
                            const Icon(Icons.lock_reset, size: 24),
                            const SizedBox(width: AppTheme.spacing12),
                            Text(
                              languageProvider.translate('reset_password',
                                  fallback: 'Şifreyi Sıfırla'),
                              style: theme.textTheme.titleMedium?.copyWith(
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
    );
  }

  Widget _buildAdditionalActions(
      BuildContext context, LanguageProvider languageProvider) {
    final theme = Theme.of(context);

    return Column(
      children: [
        TextButton(
          onPressed: () => context.go('/login'),
          child: Text(
            languageProvider.translate('back_to_login',
                fallback: 'Giriş Sayfasına Dön'),
            style: theme.textTheme.labelLarge?.copyWith(
              color: theme.colorScheme.surface,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const SizedBox(height: AppTheme.spacing16),
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
