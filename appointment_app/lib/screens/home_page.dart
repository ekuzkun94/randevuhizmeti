import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:appointment_app/providers/language_provider.dart';
import 'package:appointment_app/providers/theme_provider.dart';
import 'package:appointment_app/widgets/theme_switcher.dart';
import 'package:appointment_app/theme/app_theme.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<LanguageProvider, ThemeProvider>(
      builder: (context, languageProvider, themeProvider, child) {
        // Dil sistemi yüklenene kadar loading göster
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
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Header
                    _buildHeader(context, languageProvider, themeProvider),
                    const SizedBox(height: AppTheme.spacing56),

                    // Main content
                    _buildMainContent(context, languageProvider),
                    const SizedBox(height: AppTheme.spacing40),

                    // Action buttons
                    _buildActionButtons(context, languageProvider),
                    const SizedBox(height: AppTheme.spacing40),

                    // Footer
                    _buildFooter(context, languageProvider),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, LanguageProvider languageProvider,
      ThemeProvider themeProvider) {
    final theme = Theme.of(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Logo
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: theme.colorScheme.shadow.withOpacity(0.2),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipOval(
            child: Image.asset(
              'assets/images/zamanyonet_logo.png',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Icon(
                  Icons.calendar_today,
                  size: 32,
                  color: theme.colorScheme.primary,
                );
              },
            ),
          ),
        ),

        // Sağ taraf - Dil ve tema seçenekleri
        Row(
          children: [
            // Dil seçeneği
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacing12, vertical: AppTheme.spacing8),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface.withOpacity(0.2),
                borderRadius: BorderRadius.circular(AppTheme.radius20),
                border: Border.all(
                    color: theme.colorScheme.surface.withOpacity(0.3)),
              ),
              child: DropdownButton<String>(
                value: languageProvider.currentLanguage?.id ?? 'tr',
                dropdownColor: theme.colorScheme.surface.withOpacity(0.95),
                icon: Icon(Icons.expand_more,
                    color: theme.colorScheme.surface, size: 20),
                underline: Container(),
                style:
                    TextStyle(color: theme.colorScheme.surface, fontSize: 14),
                items: languageProvider.availableLanguages.map((language) {
                  return DropdownMenuItem<String>(
                    value: language.id,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(language.flagEmoji,
                            style: const TextStyle(fontSize: 16)),
                        const SizedBox(width: AppTheme.spacing8),
                        Text(
                          language.nativeName,
                          style: TextStyle(
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
                onChanged: (languageId) {
                  if (languageId != null) {
                    languageProvider.setLanguageById(languageId);
                  }
                },
                selectedItemBuilder: (BuildContext context) {
                  return languageProvider.availableLanguages.map((language) {
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(language.flagEmoji,
                            style: const TextStyle(fontSize: 16)),
                        const SizedBox(width: AppTheme.spacing8),
                        Text(
                          language.id.toUpperCase(),
                          style: TextStyle(
                            color: theme.colorScheme.surface,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    );
                  }).toList();
                },
              ),
            ),

            const SizedBox(width: AppTheme.spacing12),

            // Tema değiştirici
            QuickThemeToggle(
              size: 40,
              backgroundColor: theme.colorScheme.surface.withOpacity(0.2),
              iconColor: theme.colorScheme.surface,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMainContent(
      BuildContext context, LanguageProvider languageProvider) {
    final theme = Theme.of(context);

    return Column(
      children: [
        // Logo büyük
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: theme.colorScheme.shadow.withOpacity(0.2),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipOval(
            child: Image.asset(
              'assets/images/zamanyonet_logo.png',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Icon(
                  Icons.schedule,
                  size: 60,
                  color: theme.colorScheme.primary,
                );
              },
            ),
          ),
        ),
        const SizedBox(height: AppTheme.spacing32),

        // Başlık
        Text(
          languageProvider.translate('app_title', fallback: 'ZAMANYÖNET'),
          style: theme.textTheme.displaySmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.surface,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppTheme.spacing12),

        // Alt başlık
        Text(
          languageProvider.translate('app_subtitle',
              fallback: 'Modern Randevu Yönetim Sistemi'),
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.surface.withOpacity(0.8),
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppTheme.spacing24),

        // Açıklama
        Container(
          padding: const EdgeInsets.all(AppTheme.spacing20),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface.withOpacity(0.1),
            borderRadius: BorderRadius.circular(AppTheme.radius16),
            border:
                Border.all(color: theme.colorScheme.surface.withOpacity(0.2)),
          ),
          child: Text(
            languageProvider.translate('welcome_description',
                fallback:
                    'Kolay ve hızlı randevu yönetimi için tasarlanmış modern platform. '
                    'Hesabınız varsa giriş yapın, yoksa misafir olarak hızlı randevu alabilirsiniz.'),
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.surface,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(
      BuildContext context, LanguageProvider languageProvider) {
    final theme = Theme.of(context);

    return Column(
      children: [
        // Giriş Yap butonu
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () => context.go('/login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.surface,
              foregroundColor: theme.colorScheme.primary,
              elevation: AppTheme.elevation8,
              shadowColor: theme.colorScheme.shadow.withOpacity(0.3),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.login, size: 24),
                const SizedBox(width: AppTheme.spacing12),
                Text(
                  languageProvider.translate('login', fallback: 'Giriş Yap'),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppTheme.spacing16),

        // Hızlı Randevu butonu
        SizedBox(
          width: double.infinity,
          height: 56,
          child: OutlinedButton(
            onPressed: () => context.go('/guest-booking'),
            style: OutlinedButton.styleFrom(
              foregroundColor: theme.colorScheme.surface,
              side: BorderSide(color: theme.colorScheme.surface, width: 2),
              elevation: AppTheme.elevation4,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.flash_on, size: 24),
                const SizedBox(width: AppTheme.spacing12),
                Text(
                  languageProvider.translate('quick_booking',
                      fallback: 'Hızlı Randevu'),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppTheme.spacing16),

        // Kayıt ol kartı
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppTheme.spacing20),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface.withOpacity(0.1),
            borderRadius: BorderRadius.circular(AppTheme.radius16),
            border:
                Border.all(color: theme.colorScheme.surface.withOpacity(0.3)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppTheme.spacing8),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(AppTheme.radius8),
                    ),
                    child: Icon(
                      Icons.person_add_outlined,
                      color: theme.colorScheme.surface,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacing12),
                  Expanded(
                    child: Text(
                      languageProvider.translate('create_account_desc',
                          fallback:
                              'Hemen hesap oluşturun ve platformumuzun avantajlarından yararlanın'),
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.surface,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacing16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => context.go('/register'),
                  icon: const Icon(Icons.app_registration, size: 20),
                  label: Text(
                    languageProvider.translate('register_now',
                        fallback: 'Hemen Kayıt Ol'),
                    style: theme.textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: theme.colorScheme.surface,
                    side:
                        BorderSide(color: theme.colorScheme.surface, width: 2),
                    padding: const EdgeInsets.symmetric(
                        vertical: AppTheme.spacing12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFooter(BuildContext context, LanguageProvider languageProvider) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing24),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppTheme.radius16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: theme.colorScheme.shadow.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: Image.asset(
                    'assets/images/zamanyonet_logo.png',
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Icon(
                        Icons.calendar_today,
                        size: 20,
                        color: theme.colorScheme.primary,
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(width: AppTheme.spacing12),
              Text(
                languageProvider.translate('app_title', fallback: 'ZAMANYÖNET'),
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.surface,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing8),
          Text(
            '© 2024 ${languageProvider.translate('app_title', fallback: 'ZAMANYÖNET')}',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.surface.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }
}
