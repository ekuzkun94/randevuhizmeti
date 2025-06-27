import 'package:flutter/material.dart';
import 'package:appointment_app/theme/app_theme.dart';

class ModernCards {
  // Glassmorphism Card
  static Widget glassCard({
    required Widget child,
    required bool isDark,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    BorderRadius? borderRadius,
    double blurRadius = 10,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: ModernUI.glassContainer(
        isDark: isDark,
        blurRadius: blurRadius,
        padding: padding ?? const EdgeInsets.all(AppTheme.spacing20),
        margin: margin ?? const EdgeInsets.all(AppTheme.spacing8),
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radius16),
        child: child,
      ),
    );
  }

  // Gradient Card
  static Widget gradientCard({
    required Widget child,
    required List<Color> gradientColors,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    BorderRadius? borderRadius,
    AlignmentGeometry begin = Alignment.topLeft,
    AlignmentGeometry end = Alignment.bottomRight,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: ModernUI.gradientContainer(
        gradientColors: gradientColors,
        padding: padding ?? const EdgeInsets.all(AppTheme.spacing20),
        margin: margin ?? const EdgeInsets.all(AppTheme.spacing8),
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radius16),
        begin: begin,
        end: end,
        child: child,
      ),
    );
  }

  // Animated Card
  static Widget animatedCard({
    required Widget child,
    required bool isDark,
    required bool isVisible,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    BorderRadius? borderRadius,
    Duration duration = AppTheme.animationNormal,
    Curve curve = AppTheme.animationCurveNormal,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: ModernUI.animatedContainer(
        isVisible: isVisible,
        duration: duration,
        curve: curve,
        child: ModernUI.modernCard(
          isDark: isDark,
          padding: padding ?? const EdgeInsets.all(AppTheme.spacing20),
          margin: margin ?? const EdgeInsets.all(AppTheme.spacing8),
          borderRadius:
              borderRadius ?? BorderRadius.circular(AppTheme.radius16),
          child: child,
        ),
      ),
    );
  }

  // Info Card
  static Widget infoCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isDark,
    Color? iconColor,
    Color? backgroundColor,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    VoidCallback? onTap,
  }) {
    return ModernUI.modernCard(
      isDark: isDark,
      padding: padding ?? const EdgeInsets.all(AppTheme.spacing20),
      margin: margin ?? const EdgeInsets.all(AppTheme.spacing8),
      child: GestureDetector(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppTheme.radius12),
                color: iconColor?.withOpacity(0.1) ??
                    (isDark
                        ? AppTheme.darkColorScheme.primary.withOpacity(0.1)
                        : AppTheme.lightColorScheme.primary.withOpacity(0.1)),
              ),
              child: Icon(
                icon,
                color: iconColor ??
                    (isDark
                        ? AppTheme.darkColorScheme.primary
                        : AppTheme.lightColorScheme.primary),
                size: 24,
              ),
            ),
            const SizedBox(width: AppTheme.spacing16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
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
                    subtitle,
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
            if (onTap != null)
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: isDark
                    ? AppTheme.darkColorScheme.onSurfaceVariant
                    : AppTheme.lightColorScheme.onSurfaceVariant,
              ),
          ],
        ),
      ),
    );
  }

  // Stats Card
  static Widget statsCard({
    required String title,
    required String value,
    required IconData icon,
    required bool isDark,
    Color? iconColor,
    Color? valueColor,
    List<Color>? gradientColors,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
  }) {
    Widget cardContent = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppTheme.radius8),
                color: iconColor?.withOpacity(0.1) ??
                    (isDark
                        ? AppTheme.darkColorScheme.primary.withOpacity(0.1)
                        : AppTheme.lightColorScheme.primary.withOpacity(0.1)),
              ),
              child: Icon(
                icon,
                color: iconColor ??
                    (isDark
                        ? AppTheme.darkColorScheme.primary
                        : AppTheme.lightColorScheme.primary),
                size: 20,
              ),
            ),
            if (gradientColors != null)
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppTheme.radius6),
                  gradient: LinearGradient(
                    colors: gradientColors,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: AppTheme.spacing16),
        Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isDark
                ? AppTheme.darkColorScheme.onSurfaceVariant
                : AppTheme.lightColorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: AppTheme.spacing8),
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: valueColor ??
                (isDark
                    ? AppTheme.darkColorScheme.onSurface
                    : AppTheme.lightColorScheme.onSurface),
          ),
        ),
      ],
    );

    if (gradientColors != null) {
      return ModernUI.gradientContainer(
        gradientColors: gradientColors,
        padding: padding ?? const EdgeInsets.all(AppTheme.spacing20),
        margin: margin ?? const EdgeInsets.all(AppTheme.spacing8),
        child: cardContent,
      );
    } else {
      return ModernUI.modernCard(
        isDark: isDark,
        padding: padding ?? const EdgeInsets.all(AppTheme.spacing20),
        margin: margin ?? const EdgeInsets.all(AppTheme.spacing8),
        child: cardContent,
      );
    }
  }

  // Profile Card
  static Widget profileCard({
    required String name,
    required String email,
    String? avatarUrl,
    required bool isDark,
    VoidCallback? onTap,
    List<Widget>? actions,
  }) {
    return ModernUI.modernCard(
      isDark: isDark,
      padding: const EdgeInsets.all(AppTheme.spacing20),
      margin: const EdgeInsets.all(AppTheme.spacing8),
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppTheme.radius32),
                    color: isDark
                        ? AppTheme.darkColorScheme.primary.withOpacity(0.1)
                        : AppTheme.lightColorScheme.primary.withOpacity(0.1),
                  ),
                  child: avatarUrl != null
                      ? ClipRRect(
                          borderRadius:
                              BorderRadius.circular(AppTheme.radius32),
                          child: Image.network(
                            avatarUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Icon(
                                Icons.person,
                                size: 30,
                                color: isDark
                                    ? AppTheme.darkColorScheme.primary
                                    : AppTheme.lightColorScheme.primary,
                              );
                            },
                          ),
                        )
                      : Icon(
                          Icons.person,
                          size: 30,
                          color: isDark
                              ? AppTheme.darkColorScheme.primary
                              : AppTheme.lightColorScheme.primary,
                        ),
                ),
                const SizedBox(width: AppTheme.spacing16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppTheme.darkColorScheme.onSurface
                              : AppTheme.lightColorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacing4),
                      Text(
                        email,
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
                if (onTap != null)
                  Icon(
                    Icons.edit,
                    size: 20,
                    color: isDark
                        ? AppTheme.darkColorScheme.onSurfaceVariant
                        : AppTheme.lightColorScheme.onSurfaceVariant,
                  ),
              ],
            ),
            if (actions != null) ...[
              const SizedBox(height: AppTheme.spacing16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: actions,
              ),
            ],
          ],
        ),
      ),
    );
  }

  // Notification Card
  static Widget notificationCard({
    required String title,
    required String message,
    required DateTime time,
    required bool isDark,
    bool isRead = false,
    VoidCallback? onTap,
    VoidCallback? onDismiss,
  }) {
    return ModernUI.animatedContainer(
      isVisible: true,
      child: ModernUI.modernCard(
        isDark: isDark,
        padding: const EdgeInsets.all(AppTheme.spacing16),
        margin: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacing8, vertical: AppTheme.spacing4),
        child: GestureDetector(
          onTap: onTap,
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isRead
                      ? Colors.transparent
                      : (isDark
                          ? AppTheme.darkColorScheme.primary
                          : AppTheme.lightColorScheme.primary),
                ),
              ),
              const SizedBox(width: AppTheme.spacing12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
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
                      message,
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark
                            ? AppTheme.darkColorScheme.onSurfaceVariant
                            : AppTheme.lightColorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacing8),
                    Text(
                      _formatTime(time),
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppTheme.darkColorScheme.onSurfaceVariant
                            : AppTheme.lightColorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              if (onDismiss != null)
                IconButton(
                  onPressed: onDismiss,
                  icon: Icon(
                    Icons.close,
                    size: 20,
                    color: isDark
                        ? AppTheme.darkColorScheme.onSurfaceVariant
                        : AppTheme.lightColorScheme.onSurfaceVariant,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // Settings Card
  static Widget settingsCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isDark,
    Widget? trailing,
    VoidCallback? onTap,
    bool showDivider = true,
  }) {
    return Column(
      children: [
        ModernUI.modernCard(
          isDark: isDark,
          padding: const EdgeInsets.all(AppTheme.spacing16),
          margin: EdgeInsets.zero,
          child: GestureDetector(
            onTap: onTap,
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppTheme.radius8),
                    color: isDark
                        ? AppTheme.darkColorScheme.primary.withOpacity(0.1)
                        : AppTheme.lightColorScheme.primary.withOpacity(0.1),
                  ),
                  child: Icon(
                    icon,
                    color: isDark
                        ? AppTheme.darkColorScheme.primary
                        : AppTheme.lightColorScheme.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: AppTheme.spacing16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppTheme.darkColorScheme.onSurface
                              : AppTheme.lightColorScheme.onSurface,
                        ),
                      ),
                      if (subtitle.isNotEmpty) ...[
                        const SizedBox(height: AppTheme.spacing4),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark
                                ? AppTheme.darkColorScheme.onSurfaceVariant
                                : AppTheme.lightColorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (trailing != null) trailing,
                if (onTap != null)
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: isDark
                        ? AppTheme.darkColorScheme.onSurfaceVariant
                        : AppTheme.lightColorScheme.onSurfaceVariant,
                  ),
              ],
            ),
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            color: isDark
                ? AppTheme.darkColorScheme.outline
                : AppTheme.lightColorScheme.outline,
            indent: AppTheme.spacing72,
          ),
      ],
    );
  }

  // Helper method to format time
  static String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inDays > 0) {
      return '${difference.inDays} gün önce';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} saat önce';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} dakika önce';
    } else {
      return 'Az önce';
    }
  }
}
