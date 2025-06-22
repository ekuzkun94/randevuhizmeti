import 'package:flutter/material.dart';

class AppLocalizations {
  static AppLocalizations? _instance;
  late Map<String, String> _localizedStrings;

  AppLocalizations._internal();

  static AppLocalizations get instance {
    _instance ??= AppLocalizations._internal();
    return _instance!;
  }

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        instance;
  }

  Future<bool> load(Locale locale) async {
    // Load localized strings based on locale
    if (locale.languageCode == 'tr') {
      _localizedStrings = _turkishStrings;
    } else {
      _localizedStrings = _englishStrings;
    }
    
    return true;
  }

  String translate(String key) {
    return _localizedStrings[key] ?? key;
  }

  static const Map<String, String> _turkishStrings = {
    'appTitle': 'Randevu Sistemi',
    'login': 'Giriş Yap',
    'email': 'E-posta',
    'password': 'Şifre',
    'forgotPassword': 'Şifremi Unuttum',
    'adminDashboardTitle': 'Admin Paneli',
    'usersTitle': 'Kullanıcılar',
    'rolesTitle': 'Roller',
    'servicesTitle': 'Hizmetler',
    'appointmentsTitle': 'Randevular',
  };

  static const Map<String, String> _englishStrings = {
    'appTitle': 'Appointment System',
    'login': 'Login',
    'email': 'Email',
    'password': 'Password',
    'forgotPassword': 'Forgot Password',
    'adminDashboardTitle': 'Admin Dashboard',
    'usersTitle': 'Users',
    'rolesTitle': 'Roles',
    'servicesTitle': 'Services',
    'appointmentsTitle': 'Appointments',
  };
} 