import 'package:flutter/material.dart';
import 'package:appointment_app/theme/app_theme.dart';

class ModernInputs {
  // Modern Text Field
  static Widget modernTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    bool isDark = false,
    bool isPassword = false,
    bool isEnabled = true,
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
    String? Function(String?)? validator,
    VoidCallback? onTap,
    Function(String)? onChanged,
    Function(String)? onSubmitted,
    Widget? prefixIcon,
    Widget? suffixIcon,
    int? maxLines,
    int? maxLength,
    bool autofocus = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing8),
        TextFormField(
          controller: controller,
          obscureText: isPassword,
          enabled: isEnabled,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          validator: validator,
          onTap: onTap,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          maxLines: maxLines ?? 1,
          maxLength: maxLength,
          autofocus: autofocus,
          style: TextStyle(
            fontSize: 16,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: isDark
                ? AppTheme.darkColorScheme.surfaceContainerHighest
                : AppTheme.lightColorScheme.surfaceContainerHighest,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              borderSide: BorderSide(
                color: isDark
                    ? AppTheme.darkColorScheme.outline.withOpacity(0.3)
                    : AppTheme.lightColorScheme.outline.withOpacity(0.3),
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              borderSide: BorderSide(
                color: isDark
                    ? AppTheme.darkColorScheme.primary
                    : AppTheme.lightColorScheme.primary,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              borderSide: BorderSide(
                color: isDark
                    ? AppTheme.darkColorScheme.error
                    : AppTheme.lightColorScheme.error,
                width: 1.5,
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacing16,
              vertical: AppTheme.spacing16,
            ),
            hintStyle: TextStyle(
              color: isDark
                  ? AppTheme.darkColorScheme.onSurfaceVariant.withOpacity(0.7)
                  : AppTheme.lightColorScheme.onSurfaceVariant.withOpacity(0.7),
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
      ],
    );
  }

  // Search Bar
  static Widget searchBar({
    required TextEditingController controller,
    required bool isDark,
    String hint = 'Ara...',
    Function(String)? onChanged,
    Function(String)? onSubmitted,
    VoidCallback? onClear,
    List<Widget>? actions,
  }) {
    return ModernUI.glassContainer(
      isDark: isDark,
      padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacing16, vertical: AppTheme.spacing12),
      margin: const EdgeInsets.all(AppTheme.spacing8),
      child: Row(
        children: [
          Icon(
            Icons.search,
            color: isDark
                ? AppTheme.darkColorScheme.onSurfaceVariant
                : AppTheme.lightColorScheme.onSurfaceVariant,
            size: 20,
          ),
          const SizedBox(width: AppTheme.spacing12),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              onSubmitted: onSubmitted,
              style: TextStyle(
                fontSize: 16,
                color: isDark
                    ? AppTheme.darkColorScheme.onSurface
                    : AppTheme.lightColorScheme.onSurface,
              ),
              decoration: InputDecoration(
                hintText: hint,
                border: InputBorder.none,
                hintStyle: TextStyle(
                  color: isDark
                      ? AppTheme.darkColorScheme.onSurfaceVariant
                          .withOpacity(0.7)
                      : AppTheme.lightColorScheme.onSurfaceVariant
                          .withOpacity(0.7),
                  fontSize: 16,
                ),
              ),
            ),
          ),
          if (controller.text.isNotEmpty && onClear != null)
            GestureDetector(
              onTap: onClear,
              child: Icon(
                Icons.clear,
                color: isDark
                    ? AppTheme.darkColorScheme.onSurfaceVariant
                    : AppTheme.lightColorScheme.onSurfaceVariant,
                size: 20,
              ),
            ),
          if (actions != null) ...[
            const SizedBox(width: AppTheme.spacing8),
            ...actions,
          ],
        ],
      ),
    );
  }

  // Dropdown Field
  static Widget dropdownField({
    required String label,
    required String? value,
    required List<DropdownMenuItem<String>> items,
    required bool isDark,
    required Function(String?) onChanged,
    String? hint,
    bool isEnabled = true,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing8),
        DropdownButtonFormField<String>(
          value: value,
          items: items,
          onChanged: isEnabled ? onChanged : null,
          validator: validator,
          style: TextStyle(
            fontSize: 16,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: isDark
                ? AppTheme.darkColorScheme.surfaceContainerHighest
                : AppTheme.lightColorScheme.surfaceContainerHighest,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              borderSide: BorderSide(
                color: isDark
                    ? AppTheme.darkColorScheme.outline.withOpacity(0.3)
                    : AppTheme.lightColorScheme.outline.withOpacity(0.3),
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              borderSide: BorderSide(
                color: isDark
                    ? AppTheme.darkColorScheme.primary
                    : AppTheme.lightColorScheme.primary,
                width: 2,
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacing16,
              vertical: AppTheme.spacing16,
            ),
            hintStyle: TextStyle(
              color: isDark
                  ? AppTheme.darkColorScheme.onSurfaceVariant.withOpacity(0.7)
                  : AppTheme.lightColorScheme.onSurfaceVariant.withOpacity(0.7),
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
          ),
          dropdownColor: isDark
              ? AppTheme.darkColorScheme.surface
              : AppTheme.lightColorScheme.surface,
          icon: Icon(
            Icons.keyboard_arrow_down,
            color: isDark
                ? AppTheme.darkColorScheme.onSurfaceVariant
                : AppTheme.lightColorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  // Date Picker Field
  static Widget datePickerField({
    required String label,
    required DateTime? selectedDate,
    required bool isDark,
    required Function(DateTime) onDateSelected,
    String? hint,
    DateTime? firstDate,
    DateTime? lastDate,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing8),
        GestureDetector(
          onTap: () async {
            final date = await showDatePicker(
              context: navigatorKey.currentContext!,
              initialDate: selectedDate ?? DateTime.now(),
              firstDate: firstDate ?? DateTime(2020),
              lastDate: lastDate ?? DateTime(2030),
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: isDark
                        ? AppTheme.darkColorScheme
                        : AppTheme.lightColorScheme,
                  ),
                  child: child!,
                );
              },
            );
            if (date != null) {
              onDateSelected(date);
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacing16,
              vertical: AppTheme.spacing16,
            ),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              color: isDark
                  ? AppTheme.darkColorScheme.surfaceContainerHighest
                  : AppTheme.lightColorScheme.surfaceContainerHighest,
              border: Border.all(
                color: isDark
                    ? AppTheme.darkColorScheme.outline.withOpacity(0.3)
                    : AppTheme.lightColorScheme.outline.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  color: isDark
                      ? AppTheme.darkColorScheme.onSurfaceVariant
                      : AppTheme.lightColorScheme.onSurfaceVariant,
                  size: 20,
                ),
                const SizedBox(width: AppTheme.spacing12),
                Expanded(
                  child: Text(
                    selectedDate != null
                        ? '${selectedDate.day.toString().padLeft(2, '0')}/${selectedDate.month.toString().padLeft(2, '0')}/${selectedDate.year}'
                        : hint ?? 'Tarih seçin',
                    style: TextStyle(
                      fontSize: 16,
                      color: selectedDate != null
                          ? (isDark
                              ? AppTheme.darkColorScheme.onSurface
                              : AppTheme.lightColorScheme.onSurface)
                          : (isDark
                              ? AppTheme.darkColorScheme.onSurfaceVariant
                                  .withOpacity(0.7)
                              : AppTheme.lightColorScheme.onSurfaceVariant
                                  .withOpacity(0.7)),
                    ),
                  ),
                ),
                Icon(
                  Icons.keyboard_arrow_down,
                  color: isDark
                      ? AppTheme.darkColorScheme.onSurfaceVariant
                      : AppTheme.lightColorScheme.onSurfaceVariant,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Time Picker Field
  static Widget timePickerField({
    required String label,
    required TimeOfDay? selectedTime,
    required bool isDark,
    required Function(TimeOfDay) onTimeSelected,
    String? hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDark
                ? AppTheme.darkColorScheme.onSurface
                : AppTheme.lightColorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppTheme.spacing8),
        GestureDetector(
          onTap: () async {
            final time = await showTimePicker(
              context: navigatorKey.currentContext!,
              initialTime: selectedTime ?? TimeOfDay.now(),
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: isDark
                        ? AppTheme.darkColorScheme
                        : AppTheme.lightColorScheme,
                  ),
                  child: child!,
                );
              },
            );
            if (time != null) {
              onTimeSelected(time);
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacing16,
              vertical: AppTheme.spacing16,
            ),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppTheme.radius12),
              color: isDark
                  ? AppTheme.darkColorScheme.surfaceContainerHighest
                  : AppTheme.lightColorScheme.surfaceContainerHighest,
              border: Border.all(
                color: isDark
                    ? AppTheme.darkColorScheme.outline.withOpacity(0.3)
                    : AppTheme.lightColorScheme.outline.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.access_time,
                  color: isDark
                      ? AppTheme.darkColorScheme.onSurfaceVariant
                      : AppTheme.lightColorScheme.onSurfaceVariant,
                  size: 20,
                ),
                const SizedBox(width: AppTheme.spacing12),
                Expanded(
                  child: Text(
                    selectedTime != null
                        ? selectedTime.format(navigatorKey.currentContext!)
                        : hint ?? 'Saat seçin',
                    style: TextStyle(
                      fontSize: 16,
                      color: selectedTime != null
                          ? (isDark
                              ? AppTheme.darkColorScheme.onSurface
                              : AppTheme.lightColorScheme.onSurface)
                          : (isDark
                              ? AppTheme.darkColorScheme.onSurfaceVariant
                                  .withOpacity(0.7)
                              : AppTheme.lightColorScheme.onSurfaceVariant
                                  .withOpacity(0.7)),
                    ),
                  ),
                ),
                Icon(
                  Icons.keyboard_arrow_down,
                  color: isDark
                      ? AppTheme.darkColorScheme.onSurfaceVariant
                      : AppTheme.lightColorScheme.onSurfaceVariant,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Switch Field
  static Widget switchField({
    required String label,
    required String? subtitle,
    required bool value,
    required bool isDark,
    required Function(bool) onChanged,
  }) {
    return ModernUI.modernCard(
      isDark: isDark,
      padding: const EdgeInsets.all(AppTheme.spacing16),
      margin: const EdgeInsets.all(AppTheme.spacing8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? AppTheme.darkColorScheme.onSurface
                        : AppTheme.lightColorScheme.onSurface,
                  ),
                ),
                if (subtitle != null) ...[
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
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: isDark
                ? AppTheme.darkColorScheme.primary
                : AppTheme.lightColorScheme.primary,
          ),
        ],
      ),
    );
  }

  // Slider Field
  static Widget sliderField({
    required String label,
    required double value,
    required bool isDark,
    required Function(double) onChanged,
    double min = 0.0,
    double max = 100.0,
    int? divisions,
    String? valueLabel,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isDark
                    ? AppTheme.darkColorScheme.onSurface
                    : AppTheme.lightColorScheme.onSurface,
              ),
            ),
            if (valueLabel != null)
              Text(
                valueLabel,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? AppTheme.darkColorScheme.primary
                      : AppTheme.lightColorScheme.primary,
                ),
              ),
          ],
        ),
        const SizedBox(height: AppTheme.spacing16),
        Slider(
          value: value,
          min: min,
          max: max,
          divisions: divisions,
          onChanged: onChanged,
          activeColor: isDark
              ? AppTheme.darkColorScheme.primary
              : AppTheme.lightColorScheme.primary,
          inactiveColor: isDark
              ? AppTheme.darkColorScheme.surfaceContainerHighest
              : AppTheme.lightColorScheme.surfaceContainerHighest,
        ),
      ],
    );
  }
}

// Global navigator key for date/time pickers
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
