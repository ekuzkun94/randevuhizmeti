import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';

class ThemeSwitcher extends StatelessWidget {
  final bool showLabel;
  final double size;
  final Color? backgroundColor;
  final Color? iconColor;

  const ThemeSwitcher({
    super.key,
    this.showLabel = false,
    this.size = 40,
    this.backgroundColor,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final theme = Theme.of(context);
        final isDark = theme.brightness == Brightness.dark;

        return PopupMenuButton<ThemeMode>(
          icon: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: backgroundColor ??
                  (isDark
                      ? theme.colorScheme.surfaceContainerHighest
                      : theme.colorScheme.primaryContainer),
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.shadow.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              themeProvider.getThemeModeIcon(),
              color: iconColor ?? theme.colorScheme.onSurfaceVariant,
              size: size * 0.5,
            ),
          ),
          onSelected: (ThemeMode mode) {
            themeProvider.setThemeMode(mode);
          },
          itemBuilder: (BuildContext context) => [
            _buildThemeOption(
              context,
              ThemeMode.light,
              'Açık Tema',
              Icons.light_mode,
              themeProvider.isLightMode,
            ),
            _buildThemeOption(
              context,
              ThemeMode.dark,
              'Koyu Tema',
              Icons.dark_mode,
              themeProvider.isDarkMode,
            ),
            _buildThemeOption(
              context,
              ThemeMode.system,
              'Sistem Teması',
              Icons.brightness_auto,
              themeProvider.isSystemMode,
            ),
          ],
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radius12),
          ),
          elevation: 8,
          offset: const Offset(0, 8),
        );
      },
    );
  }

  PopupMenuItem<ThemeMode> _buildThemeOption(
    BuildContext context,
    ThemeMode mode,
    String label,
    IconData icon,
    bool isSelected,
  ) {
    final theme = Theme.of(context);

    return PopupMenuItem<ThemeMode>(
      value: mode,
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isSelected
                  ? theme.colorScheme.primary
                  : theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(AppTheme.radius8),
            ),
            child: Icon(
              icon,
              color: isSelected
                  ? theme.colorScheme.onPrimary
                  : theme.colorScheme.onSurfaceVariant,
              size: 18,
            ),
          ),
          const SizedBox(width: AppTheme.spacing12),
          Expanded(
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurface,
              ),
            ),
          ),
          if (isSelected)
            Icon(
              Icons.check,
              color: theme.colorScheme.primary,
              size: 20,
            ),
        ],
      ),
    );
  }
}

// Hızlı tema değiştirme butonu
class QuickThemeToggle extends StatelessWidget {
  final double size;
  final Color? backgroundColor;
  final Color? iconColor;

  const QuickThemeToggle({
    super.key,
    this.size = 48,
    this.backgroundColor,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final theme = Theme.of(context);
        final isDark = theme.brightness == Brightness.dark;

        return GestureDetector(
          onTap: () => themeProvider.toggleTheme(),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: backgroundColor ??
                  (isDark
                      ? theme.colorScheme.surfaceContainerHighest
                      : theme.colorScheme.primaryContainer),
              borderRadius: BorderRadius.circular(AppTheme.radius16),
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.shadow.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(
              isDark ? Icons.light_mode : Icons.dark_mode,
              color: iconColor ?? theme.colorScheme.onSurfaceVariant,
              size: size * 0.5,
            ),
          ),
        );
      },
    );
  }
}

// Tema bilgi kartı
class ThemeInfoCard extends StatelessWidget {
  const ThemeInfoCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final theme = Theme.of(context);

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spacing16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.palette,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: AppTheme.spacing8),
                    Text(
                      'Tema Ayarları',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppTheme.spacing12),
                Row(
                  children: [
                    Icon(
                      themeProvider.getThemeModeIcon(),
                      size: 20,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: AppTheme.spacing8),
                    Text(
                      themeProvider.getThemeModeName(),
                      style: theme.textTheme.bodyMedium,
                    ),
                    const Spacer(),
                    ThemeSwitcher(
                      size: 32,
                      backgroundColor: theme.colorScheme.surfaceContainerHighest,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
