import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:appointment_app/providers/language_provider.dart';
import 'package:appointment_app/providers/theme_provider.dart';
import 'package:appointment_app/widgets/theme_switcher.dart';
import 'package:appointment_app/theme/app_theme.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  String? _selectedRole;
  bool _passwordVisible = false;
  bool _confirmPasswordVisible = false;

  final List<Map<String, String>> _roles = [
    {
      'id': '2',
      'name': 'provider',
      'displayName': 'Hizmet Sağlayıcı',
      'description': 'Randevu veren profesyonel',
      'icon': '👨‍⚕️'
    },
    {
      'id': '3',
      'name': 'customer',
      'displayName': 'Müşteri',
      'description': 'Randevu alan kişi',
      'icon': '👤'
    },
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // Simulated registration - in real app this would go to database
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        final languageProvider =
            Provider.of<LanguageProvider>(context, listen: false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(languageProvider.translate('registration_successful',
                fallback: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.')),
            backgroundColor: Theme.of(context).colorScheme.primary,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radius12)),
          ),
        );

        // Navigate to login page
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        final languageProvider =
            Provider.of<LanguageProvider>(context, listen: false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '${languageProvider.translate('registration_error', fallback: 'Kayıt hatası')}: $e'),
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
                    const SizedBox(height: AppTheme.spacing32),
                    _buildRegisterForm(context, languageProvider),
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
            child: Image.asset(
              'assets/images/zamanyonet_logo.png',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Icon(
                  Icons.person_add,
                  size: 40,
                  color: theme.colorScheme.primary,
                );
              },
            ),
          ),
        ),
        const SizedBox(height: AppTheme.spacing24),
        Text(
          languageProvider.translate('register', fallback: 'Kayıt Ol'),
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.surface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing8),
        Text(
          languageProvider.translate('register_subtitle',
              fallback: 'Hesabınızı oluşturun'),
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.surface.withOpacity(0.8),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildRegisterForm(
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
            // Name Field
            TextFormField(
              controller: _nameController,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(
                labelText: languageProvider.translate('full_name',
                    fallback: 'Ad Soyad'),
                hintText: languageProvider.translate('full_name_hint',
                    fallback: 'Adınız ve soyadınız'),
                prefixIcon: Icon(
                  Icons.person_outlined,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return languageProvider.translate('name_required',
                      fallback: 'Ad soyad gerekli');
                }
                if (value.length < 2) {
                  return languageProvider.translate('name_min_length',
                      fallback: 'Ad en az 2 karakter olmalı');
                }
                return null;
              },
            ),
            const SizedBox(height: AppTheme.spacing20),

            // Email Field
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

            // Password Field
            TextFormField(
              controller: _passwordController,
              obscureText: !_passwordVisible,
              textInputAction: TextInputAction.next,
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
              obscureText: !_confirmPasswordVisible,
              textInputAction: TextInputAction.done,
              decoration: InputDecoration(
                labelText: languageProvider.translate('confirm_password',
                    fallback: 'Şifre Tekrar'),
                hintText: languageProvider.translate('confirm_password_hint',
                    fallback: 'Şifrenizi tekrar girin'),
                prefixIcon: Icon(
                  Icons.lock_outlined,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                suffixIcon: IconButton(
                  icon: Icon(
                    _confirmPasswordVisible
                        ? Icons.visibility
                        : Icons.visibility_off,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  onPressed: () {
                    setState(() {
                      _confirmPasswordVisible = !_confirmPasswordVisible;
                    });
                  },
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return languageProvider.translate('confirm_password_required',
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

            // Role Selection
            _buildRoleSelection(context, languageProvider),
            const SizedBox(height: AppTheme.spacing32),

            // Register Button
            SizedBox(
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _register,
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
                          const Icon(Icons.person_add, size: 24),
                          const SizedBox(width: AppTheme.spacing12),
                          Text(
                            languageProvider.translate('register',
                                fallback: 'Kayıt Ol'),
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

  Widget _buildRoleSelection(
      BuildContext context, LanguageProvider languageProvider) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          languageProvider.translate('select_role', fallback: 'Rol Seçin'),
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing12),
        ..._roles
            .map((role) => _buildRoleCard(context, role, languageProvider)),
      ],
    );
  }

  Widget _buildRoleCard(BuildContext context, Map<String, String> role,
      LanguageProvider languageProvider) {
    final theme = Theme.of(context);
    final isSelected = _selectedRole == role['id'];

    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing12),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedRole = role['id'];
          });
        },
        borderRadius: BorderRadius.circular(AppTheme.radius12),
        child: Container(
          padding: const EdgeInsets.all(AppTheme.spacing16),
          decoration: BoxDecoration(
            color: isSelected
                ? theme.colorScheme.primaryContainer
                : theme.colorScheme.surfaceVariant,
            borderRadius: BorderRadius.circular(AppTheme.radius12),
            border: Border.all(
              color: isSelected
                  ? theme.colorScheme.primary
                  : theme.colorScheme.outline.withOpacity(0.3),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isSelected
                      ? theme.colorScheme.primary
                      : theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(AppTheme.radius8),
                ),
                child: Center(
                  child: Text(
                    role['icon']!,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
              const SizedBox(width: AppTheme.spacing16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      role['displayName']!,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: isSelected
                            ? theme.colorScheme.onPrimaryContainer
                            : theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacing4),
                    Text(
                      role['description']!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isSelected
                            ? theme.colorScheme.onPrimaryContainer
                                .withOpacity(0.8)
                            : theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              if (isSelected)
                Icon(
                  Icons.check_circle,
                  color: theme.colorScheme.primary,
                  size: 24,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAdditionalActions(
      BuildContext context, LanguageProvider languageProvider) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              languageProvider.translate('already_have_account',
                  fallback: 'Zaten hesabınız var mı?'),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.surface.withOpacity(0.8),
              ),
            ),
            TextButton(
              onPressed: () => context.go('/login'),
              child: Text(
                languageProvider.translate('login', fallback: 'Giriş Yap'),
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
