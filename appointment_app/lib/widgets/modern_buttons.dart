import 'package:flutter/material.dart';
import 'package:appointment_app/theme/app_theme.dart';

class ModernButtons {
  // Gradient Button
  static Widget gradientButton({
    required String text,
    required VoidCallback? onPressed,
    required List<Color> gradientColors,
    double? width,
    double? height,
    EdgeInsetsGeometry? padding,
    BorderRadius? borderRadius,
    TextStyle? textStyle,
    IconData? icon,
    bool isLoading = false,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radius12),
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: gradientColors.first.withOpacity(0.3),
            blurRadius: 12,
            spreadRadius: 0,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius:
              borderRadius ?? BorderRadius.circular(AppTheme.radius12),
          child: Container(
            padding: padding ??
                const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacing24,
                  vertical: AppTheme.spacing16,
                ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                else if (icon != null) ...[
                  Icon(icon, color: Colors.white, size: 20),
                  const SizedBox(width: AppTheme.spacing8),
                ],
                Text(
                  text,
                  style: textStyle ??
                      const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Glassmorphism Button
  static Widget glassButton({
    required String text,
    required VoidCallback onPressed,
    required bool isDark,
    double? width,
    double? height,
    EdgeInsetsGeometry? padding,
    BorderRadius? borderRadius,
    TextStyle? textStyle,
    IconData? icon,
    bool isLoading = false,
  }) {
    return ModernUI.glassContainer(
      isDark: isDark,
      borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radius12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius:
              borderRadius ?? BorderRadius.circular(AppTheme.radius12),
          child: Container(
            width: width,
            height: height,
            padding: padding ??
                const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacing24,
                  vertical: AppTheme.spacing16,
                ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading)
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isDark
                            ? AppTheme.darkColorScheme.primary
                            : AppTheme.lightColorScheme.primary,
                      ),
                    ),
                  )
                else if (icon != null) ...[
                  Icon(
                    icon,
                    color: isDark
                        ? AppTheme.darkColorScheme.onSurface
                        : AppTheme.lightColorScheme.onSurface,
                    size: 20,
                  ),
                  const SizedBox(width: AppTheme.spacing8),
                ],
                Text(
                  text,
                  style: textStyle ??
                      TextStyle(
                        color: isDark
                            ? AppTheme.darkColorScheme.onSurface
                            : AppTheme.lightColorScheme.onSurface,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Animated Button
  static Widget animatedButton({
    required String text,
    required VoidCallback onPressed,
    required bool isDark,
    double? width,
    double? height,
    EdgeInsetsGeometry? padding,
    BorderRadius? borderRadius,
    TextStyle? textStyle,
    IconData? icon,
    bool isLoading = false,
    bool isVisible = true,
  }) {
    return ModernUI.animatedContainer(
      isVisible: isVisible,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          borderRadius:
              borderRadius ?? BorderRadius.circular(AppTheme.radius12),
          color: isDark
              ? AppTheme.darkColorScheme.primary
              : AppTheme.lightColorScheme.primary,
          boxShadow: [
            BoxShadow(
              color: (isDark
                      ? AppTheme.darkColorScheme.primary
                      : AppTheme.lightColorScheme.primary)
                  .withOpacity(0.3),
              blurRadius: 12,
              spreadRadius: 0,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: isLoading ? null : onPressed,
            borderRadius:
                borderRadius ?? BorderRadius.circular(AppTheme.radius12),
            child: Container(
              padding: padding ??
                  const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacing24,
                    vertical: AppTheme.spacing16,
                  ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (isLoading)
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  else if (icon != null) ...[
                    Icon(icon, color: Colors.white, size: 20),
                    const SizedBox(width: AppTheme.spacing8),
                  ],
                  Text(
                    text,
                    style: textStyle ??
                        const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Floating Action Button with Gradient
  static Widget gradientFAB({
    required VoidCallback onPressed,
    required List<Color> gradientColors,
    required IconData icon,
    String? tooltip,
    double? size,
  }) {
    return Container(
      width: size ?? 56,
      height: size ?? 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTheme.radius16),
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: gradientColors.first.withOpacity(0.4),
            blurRadius: 16,
            spreadRadius: 0,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(AppTheme.radius16),
          child: Icon(
            icon,
            color: Colors.white,
            size: 24,
          ),
        ),
      ),
    );
  }

  // Icon Button with Glassmorphism
  static Widget glassIconButton({
    required VoidCallback onPressed,
    required IconData icon,
    required bool isDark,
    double? size,
    Color? iconColor,
    String? tooltip,
  }) {
    return ModernUI.glassContainer(
      isDark: isDark,
      borderRadius: BorderRadius.circular(AppTheme.radius12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(AppTheme.radius12),
          child: Container(
            width: size ?? 48,
            height: size ?? 48,
            child: Icon(
              icon,
              color: iconColor ??
                  (isDark
                      ? AppTheme.darkColorScheme.onSurface
                      : AppTheme.lightColorScheme.onSurface),
              size: 24,
            ),
          ),
        ),
      ),
    );
  }

  // Social Media Button
  static Widget socialButton({
    required String text,
    required VoidCallback onPressed,
    required Color backgroundColor,
    required IconData icon,
    double? width,
    double? height,
    bool isLoading = false,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTheme.radius12),
        color: backgroundColor,
        boxShadow: [
          BoxShadow(
            color: backgroundColor.withOpacity(0.3),
            blurRadius: 12,
            spreadRadius: 0,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(AppTheme.radius12),
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacing20,
              vertical: AppTheme.spacing14,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                else ...[
                  Icon(icon, color: Colors.white, size: 20),
                  const SizedBox(width: AppTheme.spacing12),
                ],
                Text(
                  text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Toggle Button
  static Widget toggleButton({
    required bool isSelected,
    required VoidCallback onPressed,
    required String text,
    required bool isDark,
    double? width,
    double? height,
  }) {
    return AnimatedContainer(
      duration: AppTheme.animationNormal,
      curve: AppTheme.animationCurveNormal,
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTheme.radius12),
        color: isSelected
            ? (isDark
                ? AppTheme.darkColorScheme.primary
                : AppTheme.lightColorScheme.primary)
            : (isDark
                ? AppTheme.darkColorScheme.surfaceContainerHighest
                : AppTheme.lightColorScheme.surfaceContainerHighest),
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: (isDark
                          ? AppTheme.darkColorScheme.primary
                          : AppTheme.lightColorScheme.primary)
                      .withOpacity(0.3),
                  blurRadius: 8,
                  spreadRadius: 0,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(AppTheme.radius12),
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacing20,
              vertical: AppTheme.spacing12,
            ),
            child: Center(
              child: Text(
                text,
                style: TextStyle(
                  color: isSelected
                      ? Colors.white
                      : (isDark
                          ? AppTheme.darkColorScheme.onSurface
                          : AppTheme.lightColorScheme.onSurface),
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.25,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
