import 'dart:async';
import 'package:appointment_app/services/mysql_service.dart';
import 'package:appointment_app/models/language_model.dart';
import 'package:flutter/foundation.dart';

class TranslationService {
  static final TranslationService _instance = TranslationService._internal();
  factory TranslationService() => _instance;
  TranslationService._internal();

  final MySQLService _mysqlService = MySQLService.instance;
  
  // Cache
  final Map<String, Map<String, String>> _translations = {};
  List<LanguageModel> _languages = [];
  bool _isInitialized = false;

  // Fallback translations - Web ortamında MySQL çalışmadığında kullanılacak
  final Map<String, Map<String, String>> _fallbackTranslations = {
    'tr': {
      'app_title': 'ZAMANYÖNET',
      'app_subtitle': 'Modern Randevu Yönetim Sistemi',
      'welcome_to_appointment_system': 'Randevu Sistemine Hoş Geldiniz',
      'choose_your_role': 'Rolünüzü seçin',
      'admin': 'Admin',
      'admin_description': 'Sistem yönetimi',
      'provider': 'Hizmet Sağlayıcı',
      'provider_description': 'Randevu yönetimi',
      'customer': 'Müşteri',
      'customer_description': 'Randevu al',
      'guest': 'Misafir',
      'guest_description': 'Hızlı randevu',
      'continue_to_app': 'Devam Et',
      'quick_booking': 'Hızlı Randevu',
      'quick_booking_description': 'Kayıt olmadan hızlı randevu alın',
      'book_now': 'Şimdi Rezervasyon Yap',
      'login': 'Giriş Yap',
      'welcome_back': 'Tekrar Hoş Geldiniz',
      'login_subtitle': 'Hesabınıza giriş yapın ve randevu yönetiminin keyfini çıkarın',
      'email': 'E-posta',
      'password': 'Şifre',
      'email_required': 'E-posta gerekli',
      'password_required': 'Şifre gerekli',
      'forgot_password': 'Şifremi Unuttum',
      'forgot_password_coming_soon': 'Şifremi unuttum özelliği yakında!',
      'register': 'Kayıt Ol',
      'register_now': 'Hemen Kayıt Ol',
      'new_user': 'Yeni Kullanıcı?',
      'create_account_desc': 'Hemen hesap oluşturun ve platformumuzun avantajlarından yararlanın',
      'already_have_account': 'Zaten hesabınız var mı?',
      'dont_have_account': 'Hesabınız yok mu?',
      'name': 'Ad Soyad',
      'name_required': 'Ad Soyad gerekli',
      'select_role': 'Rol Seçin',
      'role_required': 'Rol seçimi gerekli',
      'confirm_password': 'Şifre Tekrar',
      'confirm_password_required': 'Şifre tekrarı gerekli',
      'passwords_dont_match': 'Şifreler eşleşmiyor',
      'password_too_short': 'Şifre en az 6 karakter olmalı',
      'invalid_email': 'Geçerli bir e-posta adresi girin',
      'email_already_exists': 'Bu e-posta adresi zaten kullanılıyor',
      'registration_successful': 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.',
      'registration_error': 'Kayıt hatası',
      'invalid_credentials': 'Geçersiz email veya şifre',
      'login_error': 'Giriş hatası',
      'test_users': 'Test Kullanıcıları:',
      'dashboard': 'Panel',
      'users': 'Kullanıcılar',
      'appointments': 'Randevular',
      'services': 'Hizmetler',
      'roles': 'Roller',
      'logout': 'Çıkış',
      'add_user': 'Kullanıcı Ekle',
      'edit_user': 'Kullanıcı Düzenle',
      'delete_user': 'Kullanıcı Sil',
      'save': 'Kaydet',
      'cancel': 'İptal',
      'delete': 'Sil',
      'edit': 'Düzenle',
      'actions': 'İşlemler',
      'created_at': 'Oluşturulma',
      'updated_at': 'Güncellenme',
      'role': 'Rol',
      'status': 'Durum',
      'active': 'Aktif',
      'inactive': 'Pasif',
      'search': 'Ara...',
      'no_data': 'Veri bulunamadı',
      'loading': 'Yükleniyor...',
      'error': 'Hata',
      'success': 'Başarılı',
      'warning': 'Uyarı',
      'info': 'Bilgi',
    },
    'en': {
      'app_title': 'TIMEMANAGER',
      'app_subtitle': 'Modern Appointment Management System',
      'welcome_to_appointment_system': 'Welcome to Appointment System',
      'choose_your_role': 'Choose your role',
      'admin': 'Admin',
      'admin_description': 'System management',
      'provider': 'Service Provider',
      'provider_description': 'Appointment management',
      'customer': 'Customer',
      'customer_description': 'Book appointments',
      'guest': 'Guest',
      'guest_description': 'Quick booking',
      'continue_to_app': 'Continue',
      'quick_booking': 'Quick Booking',
      'quick_booking_description': 'Book quickly without registration',
      'book_now': 'Book Now',
      'login': 'Login',
      'welcome_back': 'Welcome Back',
      'login_subtitle': 'Sign in to your account and enjoy appointment management',
      'email': 'Email',
      'password': 'Password',
      'email_required': 'Email is required',
      'password_required': 'Password is required',
      'forgot_password': 'Forgot Password',
      'forgot_password_coming_soon': 'Forgot password feature coming soon!',
      'register': 'Register',
      'register_now': 'Register Now',
      'new_user': 'New User?',
      'create_account_desc': 'Create an account now and enjoy the benefits of our platform',
      'already_have_account': 'Already have an account?',
      'dont_have_account': 'Don\'t have an account?',
      'name': 'Full Name',
      'name_required': 'Full name is required',
      'select_role': 'Select Role',
      'role_required': 'Role selection is required',
      'confirm_password': 'Confirm Password',
      'confirm_password_required': 'Password confirmation is required',
      'passwords_dont_match': 'Passwords don\'t match',
      'password_too_short': 'Password must be at least 6 characters',
      'invalid_email': 'Please enter a valid email address',
      'email_already_exists': 'This email address is already in use',
      'registration_successful': 'Registration successful! You can now login.',
      'registration_error': 'Registration error',
      'invalid_credentials': 'Invalid email or password',
      'login_error': 'Login error',
      'test_users': 'Test Users:',
      'dashboard': 'Dashboard',
      'users': 'Users',
      'appointments': 'Appointments',
      'services': 'Services',
      'roles': 'Roles',
      'logout': 'Logout',
      'add_user': 'Add User',
      'edit_user': 'Edit User',
      'delete_user': 'Delete User',
      'save': 'Save',
      'cancel': 'Cancel',
      'delete': 'Delete',
      'edit': 'Edit',
      'actions': 'Actions',
      'created_at': 'Created',
      'updated_at': 'Updated',
      'role': 'Role',
      'status': 'Status',
      'active': 'Active',
      'inactive': 'Inactive',
      'search': 'Search...',
      'no_data': 'No data found',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'warning': 'Warning',
      'info': 'Info',
    },
  };

  // Fallback languages
  final List<LanguageModel> _fallbackLanguages = [
    LanguageModel(
      id: 'tr',
      name: 'Turkish',
      nativeName: 'Türkçe',
      flagEmoji: '🇹🇷',
      isActive: true,
      sortOrder: 1,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    LanguageModel(
      id: 'en',
      name: 'English',
      nativeName: 'English',
      flagEmoji: '🇺🇸',
      isActive: true,
      sortOrder: 2,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ];

  bool get isInitialized => _isInitialized;
  List<LanguageModel> get languages => _languages.isNotEmpty ? _languages : _fallbackLanguages;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      debugPrint('TranslationService initializing...');
      
      // MySQL'den dilleri yüklemeye çalış
      await _loadLanguagesFromDatabase();
      
      // Eğer MySQL'den yüklenemezse fallback kullan
      if (_languages.isEmpty) {
        debugPrint('MySQL unavailable, using fallback languages');
        _languages = List.from(_fallbackLanguages);
        _translations.addAll(_fallbackTranslations);
      }

      _isInitialized = true;
      debugPrint('TranslationService initialized with ${_languages.length} languages');
      
    } catch (e) {
      debugPrint('TranslationService initialization error: $e');
      // Hata durumunda fallback kullan
      _languages = List.from(_fallbackLanguages);
      _translations.addAll(_fallbackTranslations);
      _isInitialized = true;
    }
  }

  Future<void> _loadLanguagesFromDatabase() async {
    try {
      final results = await _mysqlService.query('SELECT * FROM languages WHERE is_active = 1');
      
      _languages = results.map<LanguageModel>((row) => LanguageModel(
        id: row['id'].toString(),
        name: row['name'].toString(),
        nativeName: row['native_name'].toString(),
        flagEmoji: row['flag_emoji'].toString(),
        isActive: row['is_active'] == 1,
        sortOrder: row['sort_order'] as int? ?? 1,
        createdAt: DateTime.parse(row['created_at'].toString()),
        updatedAt: DateTime.parse(row['updated_at'].toString()),
      )).toList();

      // Her dil için çevirileri yükle
      for (final language in _languages) {
        await _loadTranslationsForLanguage(language.id);
      }
      
    } catch (e) {
      debugPrint('Database language loading error: $e');
      rethrow;
    }
  }

  Future<void> _loadTranslationsForLanguage(String languageId) async {
    try {
      final results = await _mysqlService.query('''
        SELECT translation_key, translation_value 
        FROM translations 
        WHERE language_id = ? AND is_active = 1
      ''', [languageId]);

      _translations[languageId] = {};
      for (final row in results) {
        _translations[languageId]![row['translation_key'].toString()] = 
            row['translation_value'].toString();
      }
      
      debugPrint('Loaded ${_translations[languageId]!.length} translations from database');
      
    } catch (e) {
      debugPrint('Translation loading error for $languageId: $e');
      // Hata durumunda fallback kullan
      if (_fallbackTranslations.containsKey(languageId)) {
        _translations[languageId] = Map.from(_fallbackTranslations[languageId]!);
        debugPrint('Using fallback translations for language: $languageId');
      }
    }
  }

  String translate(String key, {String languageId = 'tr', String? fallback}) {
    // Önce cache'den bak
    if (_translations.containsKey(languageId) && 
        _translations[languageId]!.containsKey(key)) {
      return _translations[languageId]![key]!;
    }

    // Fallback translation'dan bak
    if (_fallbackTranslations.containsKey(languageId) && 
        _fallbackTranslations[languageId]!.containsKey(key)) {
      return _fallbackTranslations[languageId]![key]!;
    }

    // Türkçe fallback dene
    if (languageId != 'tr' && _fallbackTranslations['tr']!.containsKey(key)) {
      return _fallbackTranslations['tr']![key]!;
    }

    // Manuel fallback
    if (fallback != null) {
      return fallback;
    }

    // Son çare olarak key'i döndür
    return key;
  }

  Future<void> addTranslation(String languageId, String key, String value) async {
    try {
      // Cache'e ekle
      _translations[languageId] ??= {};
      _translations[languageId]![key] = value;

      // Database'e ekle (eğer mümkünse)
      await _mysqlService.query('''
        INSERT INTO translations (language_id, translation_key, translation_value, is_active, created_at, updated_at)
        VALUES (?, ?, ?, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE translation_value = ?, updated_at = NOW()
      ''', [languageId, key, value, value]);
      
    } catch (e) {
      debugPrint('Add translation error: $e');
      // Database hatası olsa bile cache'e eklendi
    }
  }

  Future<void> updateTranslation(String languageId, String key, String value) async {
    await addTranslation(languageId, key, value);
  }

  Future<void> deleteTranslation(String languageId, String key) async {
    try {
      // Cache'den sil
      _translations[languageId]?.remove(key);

      // Database'den sil (eğer mümkünse)
      await _mysqlService.query('''
        UPDATE translations 
        SET is_active = 0, updated_at = NOW()
        WHERE language_id = ? AND translation_key = ?
      ''', [languageId, key]);
      
    } catch (e) {
      debugPrint('Delete translation error: $e');
    }
  }

  Future<void> reloadTranslations() async {
    _translations.clear();
    _languages.clear();
    _isInitialized = false;
    await initialize();
  }
} 