import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:ui';

class AppTheme {
  // Modern Light Theme Colors - Glassmorphism inspired
  static const ColorScheme lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: Color(0xFF6366F1), // Modern indigo
    onPrimary: Color(0xFFFFFFFF),
    primaryContainer: Color(0xFFE0E7FF),
    onPrimaryContainer: Color(0xFF3730A3),
    secondary: Color(0xFF10B981), // Modern emerald
    onSecondary: Color(0xFFFFFFFF),
    secondaryContainer: Color(0xFFD1FAE5),
    onSecondaryContainer: Color(0xFF065F46),
    tertiary: Color(0xFFF59E0B), // Modern amber
    onTertiary: Color(0xFFFFFFFF),
    tertiaryContainer: Color(0xFFFEF3C7),
    onTertiaryContainer: Color(0xFF92400E),
    error: Color(0xFFEF4444), // Modern red
    onError: Color(0xFFFFFFFF),
    errorContainer: Color(0xFFFEE2E2),
    onErrorContainer: Color(0xFF991B1B),
    surface: Color(0xFFFFFFFF),
    onSurface: Color(0xFF1F2937),
    surfaceContainerHighest: Color(0xFFF9FAFB),
    onSurfaceVariant: Color(0xFF6B7280),
    outline: Color(0xFFD1D5DB),
    outlineVariant: Color(0xFFE5E7EB),
    shadow: Color(0xFF000000),
    scrim: Color(0xFF000000),
    inverseSurface: Color(0xFF1F2937),
    onInverseSurface: Color(0xFFF9FAFB),
    inversePrimary: Color(0xFFA5B4FC),
    surfaceTint: Color(0xFF6366F1),
  );

  // Modern Dark Theme Colors - Deep and rich
  static const ColorScheme darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: Color(0xFFA5B4FC), // Light indigo
    onPrimary: Color(0xFF3730A3),
    primaryContainer: Color(0xFF6366F1),
    onPrimaryContainer: Color(0xFFE0E7FF),
    secondary: Color(0xFF6EE7B7), // Light emerald
    onSecondary: Color(0xFF065F46),
    secondaryContainer: Color(0xFF10B981),
    onSecondaryContainer: Color(0xFFD1FAE5),
    tertiary: Color(0xFFFCD34D), // Light amber
    onTertiary: Color(0xFF92400E),
    tertiaryContainer: Color(0xFFF59E0B),
    onTertiaryContainer: Color(0xFFFEF3C7),
    error: Color(0xFFF87171), // Light red
    onError: Color(0xFF991B1B),
    errorContainer: Color(0xFFEF4444),
    onErrorContainer: Color(0xFFFEE2E2),
    surface: Color(0xFF111827),
    onSurface: Color(0xFFF9FAFB),
    surfaceContainerHighest: Color(0xFF1F2937),
    onSurfaceVariant: Color(0xFF9CA3AF),
    outline: Color(0xFF374151),
    outlineVariant: Color(0xFF4B5563),
    shadow: Color(0xFF000000),
    scrim: Color(0xFF000000),
    inverseSurface: Color(0xFFF9FAFB),
    onInverseSurface: Color(0xFF111827),
    inversePrimary: Color(0xFF6366F1),
    surfaceTint: Color(0xFFA5B4FC),
  );

  // Modern Status Colors
  static const Color successColor = Color(0xFF10B981);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color infoColor = Color(0xFF3B82F6);
  static const Color dangerColor = Color(0xFFEF4444);

  // Modern Gradients
  static const List<Color> primaryGradient = [
    Color(0xFF6366F1), // Indigo
    Color(0xFF8B5CF6), // Violet
    Color(0xFFEC4899), // Pink
  ];

  static const List<Color> secondaryGradient = [
    Color(0xFF10B981), // Emerald
    Color(0xFF06B6D4), // Cyan
    Color(0xFF3B82F6), // Blue
  ];

  static const List<Color> sunsetGradient = [
    Color(0xFFF59E0B), // Amber
    Color(0xFFEF4444), // Red
    Color(0xFFEC4899), // Pink
  ];

  static const List<Color> oceanGradient = [
    Color(0xFF06B6D4), // Cyan
    Color(0xFF3B82F6), // Blue
    Color(0xFF6366F1), // Indigo
  ];

  // Glassmorphism Colors
  static const Color glassLight = Color(0x80FFFFFF);
  static const Color glassDark = Color(0x80111827);
  static const Color glassBorderLight = Color(0x40FFFFFF);
  static const Color glassBorderDark = Color(0x40FFFFFF);

  // Modern Typography with better spacing
  static const TextTheme lightTextTheme = TextTheme(
    displayLarge: TextStyle(
      fontSize: 57,
      fontWeight: FontWeight.w300,
      letterSpacing: -0.25,
      color: Color(0xFF1F2937),
      height: 1.12,
    ),
    displayMedium: TextStyle(
      fontSize: 45,
      fontWeight: FontWeight.w300,
      letterSpacing: 0,
      color: Color(0xFF1F2937),
      height: 1.16,
    ),
    displaySmall: TextStyle(
      fontSize: 36,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: Color(0xFF1F2937),
      height: 1.22,
    ),
    headlineLarge: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: Color(0xFF1F2937),
      height: 1.25,
    ),
    headlineMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: Color(0xFF1F2937),
      height: 1.29,
    ),
    headlineSmall: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: Color(0xFF1F2937),
      height: 1.33,
    ),
    titleLarge: TextStyle(
      fontSize: 22,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: Color(0xFF1F2937),
      height: 1.27,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.15,
      color: Color(0xFF1F2937),
      height: 1.5,
    ),
    titleSmall: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
      color: Color(0xFF1F2937),
      height: 1.43,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.5,
      color: Color(0xFF1F2937),
      height: 1.5,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      color: Color(0xFF1F2937),
      height: 1.43,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
      color: Color(0xFF6B7280),
      height: 1.33,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
      color: Color(0xFF1F2937),
      height: 1.43,
    ),
    labelMedium: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.5,
      color: Color(0xFF1F2937),
      height: 1.33,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.5,
      color: Color(0xFF6B7280),
      height: 1.45,
    ),
  );

  static const TextTheme darkTextTheme = TextTheme(
    displayLarge: TextStyle(
      fontSize: 57,
      fontWeight: FontWeight.w300,
      letterSpacing: -0.25,
      color: Color(0xFFF9FAFB),
      height: 1.12,
    ),
    displayMedium: TextStyle(
      fontSize: 45,
      fontWeight: FontWeight.w300,
      letterSpacing: 0,
      color: Color(0xFFF9FAFB),
      height: 1.16,
    ),
    displaySmall: TextStyle(
      fontSize: 36,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: Color(0xFFF9FAFB),
      height: 1.22,
    ),
    headlineLarge: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: Color(0xFFF9FAFB),
      height: 1.25,
    ),
    headlineMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: Color(0xFFF9FAFB),
      height: 1.29,
    ),
    headlineSmall: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: Color(0xFFF9FAFB),
      height: 1.33,
    ),
    titleLarge: TextStyle(
      fontSize: 22,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: Color(0xFFF9FAFB),
      height: 1.27,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.15,
      color: Color(0xFFF9FAFB),
      height: 1.5,
    ),
    titleSmall: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
      color: Color(0xFFF9FAFB),
      height: 1.43,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.5,
      color: Color(0xFFF9FAFB),
      height: 1.5,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      color: Color(0xFFF9FAFB),
      height: 1.43,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
      color: Color(0xFF9CA3AF),
      height: 1.33,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
      color: Color(0xFFF9FAFB),
      height: 1.43,
    ),
    labelMedium: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.5,
      color: Color(0xFFF9FAFB),
      height: 1.33,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.5,
      color: Color(0xFF9CA3AF),
      height: 1.45,
    ),
  );

  // Modern Spacing System
  static const double spacing2 = 2.0;
  static const double spacing4 = 4.0;
  static const double spacing6 = 6.0;
  static const double spacing8 = 8.0;
  static const double spacing10 = 10.0;
  static const double spacing12 = 12.0;
  static const double spacing14 = 14.0;
  static const double spacing16 = 16.0;
  static const double spacing18 = 18.0;
  static const double spacing20 = 20.0;
  static const double spacing24 = 24.0;
  static const double spacing28 = 28.0;
  static const double spacing32 = 32.0;
  static const double spacing36 = 36.0;
  static const double spacing40 = 40.0;
  static const double spacing48 = 48.0;
  static const double spacing56 = 56.0;
  static const double spacing64 = 64.0;
  static const double spacing72 = 72.0;
  static const double spacing80 = 80.0;

  // Modern Border Radius System
  static const double radius2 = 2.0;
  static const double radius4 = 4.0;
  static const double radius6 = 6.0;
  static const double radius8 = 8.0;
  static const double radius10 = 10.0;
  static const double radius12 = 12.0;
  static const double radius14 = 14.0;
  static const double radius16 = 16.0;
  static const double radius18 = 18.0;
  static const double radius20 = 20.0;
  static const double radius24 = 24.0;
  static const double radius28 = 28.0;
  static const double radius32 = 32.0;
  static const double radius40 = 40.0;
  static const double radius48 = 48.0;
  static const double radius56 = 56.0;
  static const double radius64 = 64.0;

  // Modern Elevation System
  static const double elevation0 = 0.0;
  static const double elevation1 = 1.0;
  static const double elevation2 = 2.0;
  static const double elevation3 = 3.0;
  static const double elevation4 = 4.0;
  static const double elevation6 = 6.0;
  static const double elevation8 = 8.0;
  static const double elevation12 = 12.0;
  static const double elevation16 = 16.0;
  static const double elevation24 = 24.0;
  static const double elevation32 = 32.0;

  // Animation Durations
  static const Duration animationFast = Duration(milliseconds: 150);
  static const Duration animationNormal = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);
  static const Duration animationVerySlow = Duration(milliseconds: 800);

  // Animation Curves
  static const Curve animationCurveFast = Curves.easeInOut;
  static const Curve animationCurveNormal = Curves.easeInOutCubic;
  static const Curve animationCurveSlow = Curves.easeInOutQuart;
  static const Curve animationCurveBounce = Curves.elasticOut;

  // Modern Light Theme
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: lightColorScheme,
    textTheme: lightTextTheme,
    brightness: Brightness.light,

    // AppBar Theme - Glassmorphism style
    appBarTheme: const AppBarTheme(
      elevation: 0,
      centerTitle: true,
      backgroundColor: Colors.transparent,
      foregroundColor: Color(0xFF1F2937),
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Color(0xFF1F2937),
        letterSpacing: -0.5,
      ),
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
    ),

    // Card Theme - Modern with subtle shadows
    cardTheme: CardThemeData(
      elevation: elevation2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(radius16)),
      ),
      color: lightColorScheme.surface,
      shadowColor: lightColorScheme.shadow.withOpacity(0.08),
      margin: const EdgeInsets.all(spacing8),
    ),

    // Elevated Button Theme - Modern gradient style
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        elevation: elevation2,
        padding: const EdgeInsets.symmetric(
          horizontal: spacing24,
          vertical: spacing16,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius12),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
        backgroundColor: lightColorScheme.primary,
        foregroundColor: lightColorScheme.onPrimary,
      ),
    ),

    // Outlined Button Theme - Modern border style
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(
          horizontal: spacing24,
          vertical: spacing16,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius12),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
        side: BorderSide(
          color: lightColorScheme.outline,
          width: 1.5,
        ),
      ),
    ),

    // Text Button Theme - Modern minimal style
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(
          horizontal: spacing16,
          vertical: spacing12,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius8),
        ),
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.25,
        ),
      ),
    ),

    // Input Decoration Theme - Modern floating style
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: lightColorScheme.surfaceContainerHighest,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radius12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radius12),
        borderSide: BorderSide(
          color: lightColorScheme.outline.withOpacity(0.3),
          width: 1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radius12),
        borderSide: BorderSide(
          color: lightColorScheme.primary,
          width: 2,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radius12),
        borderSide: BorderSide(
          color: lightColorScheme.error,
          width: 1.5,
        ),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: spacing16,
        vertical: spacing16,
      ),
      hintStyle: TextStyle(
        color: lightColorScheme.onSurfaceVariant.withOpacity(0.7),
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      labelStyle: TextStyle(
        color: lightColorScheme.onSurfaceVariant,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
    ),

    // Floating Action Button Theme - Modern circular style
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      elevation: elevation8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(radius16)),
      ),
      backgroundColor: Color(0xFF6366F1),
      foregroundColor: Colors.white,
    ),

    // Bottom Navigation Bar Theme - Modern glassmorphism style
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      elevation: elevation8,
      type: BottomNavigationBarType.fixed,
      selectedItemColor: Color(0xFF6366F1),
      unselectedItemColor: Color(0xFF6B7280),
      backgroundColor: Colors.white,
      selectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    ),

    // Chip Theme - Modern rounded style
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radius20),
      ),
      labelStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.25,
      ),
      backgroundColor: lightColorScheme.surfaceContainerHighest,
      selectedColor: lightColorScheme.primaryContainer,
      checkmarkColor: lightColorScheme.onPrimaryContainer,
    ),

    // Divider Theme - Modern subtle style
    dividerTheme: const DividerThemeData(
      space: 1,
      thickness: 1,
      color: Color(0xFFE5E7EB),
    ),

    // Icon Theme - Modern consistent style
    iconTheme: const IconThemeData(
      color: Color(0xFF6B7280),
      size: 24,
    ),

    // Progress Indicator Theme - Modern gradient style
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: Color(0xFF6366F1),
      linearTrackColor: Color(0xFFE5E7EB),
      circularTrackColor: Color(0xFFE5E7EB),
    ),

    // Switch Theme - Modern style
    switchTheme: SwitchThemeData(
      thumbColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return lightColorScheme.primary;
        }
        return lightColorScheme.outline;
      }),
      trackColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return lightColorScheme.primaryContainer;
        }
        return lightColorScheme.surfaceContainerHighest;
      }),
    ),

    // Slider Theme - Modern style
    sliderTheme: SliderThemeData(
      activeTrackColor: lightColorScheme.primary,
      inactiveTrackColor: lightColorScheme.surfaceContainerHighest,
      thumbColor: lightColorScheme.primary,
      overlayColor: lightColorScheme.primary.withOpacity(0.2),
    ),
  );

  // Modern Dark Theme
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    colorScheme: darkColorScheme,
    textTheme: darkTextTheme,
    brightness: Brightness.dark,

    // AppBar Theme - Glassmorphism style
    appBarTheme: const AppBarTheme(
      elevation: 0,
      centerTitle: true,
      backgroundColor: Colors.transparent,
      foregroundColor: Color(0xFFF9FAFB),
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Color(0xFFF9FAFB),
        letterSpacing: -0.5,
      ),
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
    ),

    // Card Theme - Modern with subtle shadows
    cardTheme: CardThemeData(
      elevation: elevation2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(radius16)),
      ),
      color: darkColorScheme.surface,
      shadowColor: darkColorScheme.shadow.withOpacity(0.3),
      margin: const EdgeInsets.all(spacing8),
    ),

    // Elevated Button Theme - Modern gradient style
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        elevation: elevation2,
        padding: const EdgeInsets.symmetric(
          horizontal: spacing24,
          vertical: spacing16,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius12),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
        backgroundColor: darkColorScheme.primary,
        foregroundColor: darkColorScheme.onPrimary,
      ),
    ),

    // Outlined Button Theme - Modern border style
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(
          horizontal: spacing24,
          vertical: spacing16,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius12),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
        side: BorderSide(
          color: darkColorScheme.outline,
          width: 1.5,
        ),
      ),
    ),

    // Text Button Theme - Modern minimal style
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(
          horizontal: spacing16,
          vertical: spacing12,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius8),
        ),
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.25,
        ),
      ),
    ),

    // Input Decoration Theme - Modern floating style
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: darkColorScheme.surfaceContainerHighest,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radius12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radius12),
        borderSide: BorderSide(
          color: darkColorScheme.outline.withOpacity(0.3),
          width: 1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radius12),
        borderSide: BorderSide(
          color: darkColorScheme.primary,
          width: 2,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radius12),
        borderSide: BorderSide(
          color: darkColorScheme.error,
          width: 1.5,
        ),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: spacing16,
        vertical: spacing16,
      ),
      hintStyle: TextStyle(
        color: darkColorScheme.onSurfaceVariant.withOpacity(0.7),
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      labelStyle: TextStyle(
        color: darkColorScheme.onSurfaceVariant,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
    ),

    // Floating Action Button Theme - Modern circular style
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      elevation: elevation8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(radius16)),
      ),
      backgroundColor: Color(0xFFA5B4FC),
      foregroundColor: Color(0xFF3730A3),
    ),

    // Bottom Navigation Bar Theme - Modern glassmorphism style
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      elevation: elevation8,
      type: BottomNavigationBarType.fixed,
      selectedItemColor: Color(0xFFA5B4FC),
      unselectedItemColor: Color(0xFF9CA3AF),
      backgroundColor: Color(0xFF111827),
      selectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    ),

    // Chip Theme - Modern rounded style
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radius20),
      ),
      labelStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.25,
      ),
      backgroundColor: darkColorScheme.surfaceContainerHighest,
      selectedColor: darkColorScheme.primaryContainer,
      checkmarkColor: darkColorScheme.onPrimaryContainer,
    ),

    // Divider Theme - Modern subtle style
    dividerTheme: const DividerThemeData(
      space: 1,
      thickness: 1,
      color: Color(0xFF374151),
    ),

    // Icon Theme - Modern consistent style
    iconTheme: const IconThemeData(
      color: Color(0xFF9CA3AF),
      size: 24,
    ),

    // Progress Indicator Theme - Modern gradient style
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: Color(0xFFA5B4FC),
      linearTrackColor: Color(0xFF374151),
      circularTrackColor: Color(0xFF374151),
    ),

    // Switch Theme - Modern style
    switchTheme: SwitchThemeData(
      thumbColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return darkColorScheme.primary;
        }
        return darkColorScheme.outline;
      }),
      trackColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return darkColorScheme.primaryContainer;
        }
        return darkColorScheme.surfaceContainerHighest;
      }),
    ),

    // Slider Theme - Modern style
    sliderTheme: SliderThemeData(
      activeTrackColor: darkColorScheme.primary,
      inactiveTrackColor: darkColorScheme.surfaceContainerHighest,
      thumbColor: darkColorScheme.primary,
      overlayColor: darkColorScheme.primary.withOpacity(0.2),
    ),
  );
}

// Modern UI Helper Classes
class ModernUI {
  // Glassmorphism Container
  static Widget glassContainer({
    required Widget child,
    required bool isDark,
    double blurRadius = 10,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    BorderRadius? borderRadius,
  }) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radius16),
        color: isDark ? AppTheme.glassDark : AppTheme.glassLight,
        border: Border.all(
          color: isDark ? AppTheme.glassBorderDark : AppTheme.glassBorderLight,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: blurRadius,
            spreadRadius: 0,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radius16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurRadius, sigmaY: blurRadius),
          child: child,
        ),
      ),
    );
  }

  // Gradient Container
  static Widget gradientContainer({
    required Widget child,
    required List<Color> gradientColors,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    BorderRadius? borderRadius,
    AlignmentGeometry begin = Alignment.topLeft,
    AlignmentGeometry end = Alignment.bottomRight,
  }) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radius16),
        gradient: LinearGradient(
          colors: gradientColors,
          begin: begin,
          end: end,
        ),
        boxShadow: [
          BoxShadow(
            color: gradientColors.first.withOpacity(0.3),
            blurRadius: 20,
            spreadRadius: 0,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }

  // Animated Container
  static Widget animatedContainer({
    required Widget child,
    required bool isVisible,
    Duration duration = AppTheme.animationNormal,
    Curve curve = AppTheme.animationCurveNormal,
  }) {
    return AnimatedOpacity(
      opacity: isVisible ? 1.0 : 0.0,
      duration: duration,
      curve: curve,
      child: AnimatedContainer(
        duration: duration,
        curve: curve,
        transform: Matrix4.translationValues(
          0,
          isVisible ? 0 : 20,
          0,
        ),
        child: child,
      ),
    );
  }

  // Modern Card
  static Widget modernCard({
    required Widget child,
    required bool isDark,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    BorderRadius? borderRadius,
    double elevation = AppTheme.elevation2,
  }) {
    return Container(
      margin: margin ?? const EdgeInsets.all(AppTheme.spacing8),
      decoration: BoxDecoration(
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radius16),
        color: isDark
            ? AppTheme.darkColorScheme.surface
            : AppTheme.lightColorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.08),
            blurRadius: elevation * 2,
            spreadRadius: 0,
            offset: Offset(0, elevation),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radius16),
        child: Container(
          padding: padding ?? const EdgeInsets.all(AppTheme.spacing16),
          child: child,
        ),
      ),
    );
  }
}
