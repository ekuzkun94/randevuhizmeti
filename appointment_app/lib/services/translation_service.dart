import 'dart:async';
import 'package:appointment_app/models/language_model.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:appointment_app/config/database_config.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class TranslationService {
  static TranslationService? _instance;
  static TranslationService get instance {
    _instance ??= TranslationService._internal();
    return _instance!;
  }

  TranslationService._internal();

  String _currentLanguage = 'tr';

  // Cache
  Map<String, Map<String, String>> _translationsCache = {};
  List<LanguageModel> _availableLanguages = [];
  bool _isInitialized = false;

  // Fallback translations - Supabase API çalışmadığında kullanılacak
  final Map<String, Map<String, String>> _fallbackTranslations = {
    'tr': {
      'app_name': 'ZamanYönet',
      'welcome': 'Hoş Geldiniz',
      'login': 'Giriş Yap',
      'register': 'Kayıt Ol',
      'logout': 'Çıkış Yap',
      'email': 'E-posta',
      'password': 'Şifre',
      'name': 'Ad',
      'surname': 'Soyad',
      'phone': 'Telefon',
      'appointments': 'Randevular',
      'services': 'Hizmetler',
      'providers': 'Sağlayıcılar',
      'dashboard': 'Dashboard',
      'profile': 'Profil',
      'settings': 'Ayarlar',
      'calendar': 'Takvim',
      'notifications': 'Bildirimler',
      'search': 'Ara',
      'filter': 'Filtrele',
      'sort': 'Sırala',
      'cancel': 'İptal',
      'save': 'Kaydet',
      'delete': 'Sil',
      'edit': 'Düzenle',
      'add': 'Ekle',
      'yes': 'Evet',
      'no': 'Hayır',
      'ok': 'Tamam',
      'error': 'Hata',
      'success': 'Başarılı',
      'warning': 'Uyarı',
      'info': 'Bilgi',
      'loading': 'Yükleniyor...',
      'retry': 'Tekrar Dene',
      'refresh': 'Yenile',
      'back': 'Geri',
      'next': 'İleri',
      'previous': 'Önceki',
      'home': 'Ana Sayfa',
      'about': 'Hakkında',
      'contact': 'İletişim',
      'help': 'Yardım',
      'privacy': 'Gizlilik',
      'terms': 'Şartlar',
      'version': 'Sürüm',
      'language': 'Dil',
      'theme': 'Tema',
      'light': 'Açık',
      'dark': 'Koyu',
      'system': 'Sistem',
      'date': 'Tarih',
      'time': 'Saat',
      'duration': 'Süre',
      'price': 'Fiyat',
      'status': 'Durum',
      'category': 'Kategori',
      'description': 'Açıklama',
      'notes': 'Notlar',
      'address': 'Adres',
      'city': 'Şehir',
      'country': 'Ülke',
      'website': 'Website',
      'social_media': 'Sosyal Medya',
      'rating': 'Değerlendirme',
      'reviews': 'Yorumlar',
      'favorites': 'Favoriler',
      'history': 'Geçmiş',
      'statistics': 'İstatistikler',
      'reports': 'Raporlar',
      'analytics': 'Analiz',
      'export': 'Dışa Aktar',
      'import': 'İçe Aktar',
      'backup': 'Yedekleme',
      'restore': 'Geri Yükleme',
      'sync': 'Senkronizasyon',
      'offline': 'Çevrimdışı',
      'online': 'Çevrimiçi',
      'connecting': 'Bağlanıyor...',
      'connected': 'Bağlandı',
      'disconnected': 'Bağlantı Kesildi',
      'network_error': 'Ağ Hatası',
      'server_error': 'Sunucu Hatası',
      'timeout_error': 'Zaman Aşımı Hatası',
      'unknown_error': 'Bilinmeyen Hata',
      'invalid_credentials': 'Geçersiz Giriş Bilgileri',
      'account_locked': 'Hesap Kilitli',
      'account_suspended': 'Hesap Askıya Alındı',
      'email_not_verified': 'E-posta Doğrulanmamış',
      'password_reset_sent': 'Şifre Sıfırlama E-postası Gönderildi',
      'password_reset_success': 'Şifre Başarıyla Sıfırlandı',
      'registration_success': 'Kayıt Başarılı',
      'logout_success': 'Çıkış Başarılı',
      'appointment_created': 'Randevu Oluşturuldu',
      'appointment_updated': 'Randevu Güncellendi',
      'appointment_cancelled': 'Randevu İptal Edildi',
      'appointment_confirmed': 'Randevu Onaylandı',
      'service_added': 'Hizmet Eklendi',
      'service_updated': 'Hizmet Güncellendi',
      'service_deleted': 'Hizmet Silindi',
      'provider_added': 'Sağlayıcı Eklendi',
      'provider_updated': 'Sağlayıcı Güncellendi',
      'provider_deleted': 'Sağlayıcı Silindi',
      'profile_updated': 'Profil Güncellendi',
      'settings_saved': 'Ayarlar Kaydedildi',
      'data_synced': 'Veriler Senkronize Edildi',
      'backup_created': 'Yedek Oluşturuldu',
      'backup_restored': 'Yedek Geri Yüklendi',
      'no_data': 'Veri Bulunamadı',
      'no_appointments': 'Randevu Bulunamadı',
      'no_services': 'Hizmet Bulunamadı',
      'no_providers': 'Sağlayıcı Bulunamadı',
      'no_notifications': 'Bildirim Bulunamadı',
      'no_internet': 'İnternet Bağlantısı Yok',
      'try_again': 'Tekrar Deneyin',
      'contact_support': 'Destek ile İletişime Geçin',
      'rate_app': 'Uygulamayı Değerlendirin',
      'share_app': 'Uygulamayı Paylaşın',
      'update_available': 'Güncelleme Mevcut',
      'update_required': 'Güncelleme Gerekli',
      'maintenance_mode': 'Bakım Modu',
      'coming_soon': 'Yakında...',
      'feature_disabled': 'Özellik Devre Dışı',
      'permission_required': 'İzin Gerekli',
      'location_permission': 'Konum İzni',
      'camera_permission': 'Kamera İzni',
      'storage_permission': 'Depolama İzni',
      'notification_permission': 'Bildirim İzni',
      'grant_permission': 'İzin Ver',
      'deny_permission': 'İzni Reddet',
      'today': 'Bugün',
      'tomorrow': 'Yarın',
      'yesterday': 'Dün',
      'this_week': 'Bu Hafta',
      'next_week': 'Gelecek Hafta',
      'this_month': 'Bu Ay',
      'next_month': 'Gelecek Ay',
      'morning': 'Sabah',
      'afternoon': 'Öğleden Sonra',
      'evening': 'Akşam',
      'night': 'Gece',
      'monday': 'Pazartesi',
      'tuesday': 'Salı',
      'wednesday': 'Çarşamba',
      'thursday': 'Perşembe',
      'friday': 'Cuma',
      'saturday': 'Cumartesi',
      'sunday': 'Pazar',
      'january': 'Ocak',
      'february': 'Şubat',
      'march': 'Mart',
      'april': 'Nisan',
      'may': 'Mayıs',
      'june': 'Haziran',
      'july': 'Temmuz',
      'august': 'Ağustos',
      'september': 'Eylül',
      'october': 'Ekim',
      'november': 'Kasım',
      'december': 'Aralık',
      'minute': 'Dakika',
      'hour': 'Saat',
      'day': 'Gün',
      'week': 'Hafta',
      'month': 'Ay',
      'year': 'Yıl',
      'male': 'Erkek',
      'female': 'Kadın',
      'other': 'Diğer',
      'pending': 'Beklemede',
      'confirmed': 'Onaylandı',
      'completed': 'Tamamlandı',
      'cancelled': 'İptal Edildi',
      'active': 'Aktif',
      'inactive': 'Pasif',
      'enabled': 'Etkin',
      'disabled': 'Devre Dışı',
      'available': 'Müsait',
      'unavailable': 'Müsait Değil',
      'busy': 'Meşgul',
      'free': 'Boş',
      'open': 'Açık',
      'closed': 'Kapalı',
      'public': 'Herkese Açık',
      'private': 'Özel',
      'draft': 'Taslak',
      'published': 'Yayınlandı',
      'archived': 'Arşivlendi',
      'deleted': 'Silindi',
      'low': 'Düşük',
      'medium': 'Orta',
      'high': 'Yüksek',
      'urgent': 'Acil',
      'normal': 'Normal',
      'priority': 'Öncelik',
      'quality': 'Kalite',
      'quantity': 'Miktar',
      'total': 'Toplam',
      'subtotal': 'Ara Toplam',
      'tax': 'Vergi',
      'discount': 'İndirim',
      'payment': 'Ödeme',
      'invoice': 'Fatura',
      'receipt': 'Makbuz',
      'refund': 'İade',
      'credit': 'Kredi',
      'debit': 'Borç',
      'balance': 'Bakiye',
      'transaction': 'İşlem',
      'transfer': 'Transfer',
      'deposit': 'Para Yatırma',
      'withdrawal': 'Para Çekme',
      'cash': 'Nakit',
      'card': 'Kart',
      'bank': 'Banka',
      'account': 'Hesap',
    },
    'en': {
      'app_name': 'TimeManager',
      'welcome': 'Welcome',
      'login': 'Login',
      'register': 'Register',
      'logout': 'Logout',
      'email': 'Email',
      'password': 'Password',
      'name': 'Name',
      'surname': 'Surname',
      'phone': 'Phone',
      'appointments': 'Appointments',
      'services': 'Services',
      'providers': 'Providers',
      'dashboard': 'Dashboard',
      'profile': 'Profile',
      'settings': 'Settings',
      'calendar': 'Calendar',
      'notifications': 'Notifications',
      'search': 'Search',
      'filter': 'Filter',
      'sort': 'Sort',
      'cancel': 'Cancel',
      'save': 'Save',
      'delete': 'Delete',
      'edit': 'Edit',
      'add': 'Add',
      'yes': 'Yes',
      'no': 'No',
      'ok': 'OK',
      'error': 'Error',
      'success': 'Success',
      'warning': 'Warning',
      'info': 'Info',
      'loading': 'Loading...',
      'retry': 'Retry',
      'refresh': 'Refresh',
      'back': 'Back',
      'next': 'Next',
      'previous': 'Previous',
      'home': 'Home',
      'about': 'About',
      'contact': 'Contact',
      'help': 'Help',
      'privacy': 'Privacy',
      'terms': 'Terms',
      'version': 'Version',
      'language': 'Language',
      'theme': 'Theme',
      'light': 'Light',
      'dark': 'Dark',
      'system': 'System',
      'date': 'Date',
      'time': 'Time',
      'duration': 'Duration',
      'price': 'Price',
      'status': 'Status',
      'category': 'Category',
      'description': 'Description',
      'notes': 'Notes',
      'address': 'Address',
      'city': 'City',
      'country': 'Country',
      'website': 'Website',
      'social_media': 'Social Media',
      'rating': 'Rating',
      'reviews': 'Reviews',
      'favorites': 'Favorites',
      'history': 'History',
      'statistics': 'Statistics',
      'reports': 'Reports',
      'analytics': 'Analytics',
      'export': 'Export',
      'import': 'Import',
      'backup': 'Backup',
      'restore': 'Restore',
      'sync': 'Sync',
      'offline': 'Offline',
      'online': 'Online',
      'connecting': 'Connecting...',
      'connected': 'Connected',
      'disconnected': 'Disconnected',
      'network_error': 'Network Error',
      'server_error': 'Server Error',
      'timeout_error': 'Timeout Error',
      'unknown_error': 'Unknown Error',
      'invalid_credentials': 'Invalid Credentials',
      'account_locked': 'Account Locked',
      'account_suspended': 'Account Suspended',
      'email_not_verified': 'Email Not Verified',
      'password_reset_sent': 'Password Reset Email Sent',
      'password_reset_success': 'Password Reset Successfully',
      'registration_success': 'Registration Successful',
      'logout_success': 'Logout Successful',
      'appointment_created': 'Appointment Created',
      'appointment_updated': 'Appointment Updated',
      'appointment_cancelled': 'Appointment Cancelled',
      'appointment_confirmed': 'Appointment Confirmed',
      'service_added': 'Service Added',
      'service_updated': 'Service Updated',
      'service_deleted': 'Service Deleted',
      'provider_added': 'Provider Added',
      'provider_updated': 'Provider Updated',
      'provider_deleted': 'Provider Deleted',
      'profile_updated': 'Profile Updated',
      'settings_saved': 'Settings Saved',
      'data_synced': 'Data Synced',
      'backup_created': 'Backup Created',
      'backup_restored': 'Backup Restored',
      'no_data': 'No Data Found',
      'no_appointments': 'No Appointments Found',
      'no_services': 'No Services Found',
      'no_providers': 'No Providers Found',
      'no_notifications': 'No Notifications Found',
      'no_internet': 'No Internet Connection',
      'try_again': 'Try Again',
      'contact_support': 'Contact Support',
      'rate_app': 'Rate App',
      'share_app': 'Share App',
      'update_available': 'Update Available',
      'update_required': 'Update Required',
      'maintenance_mode': 'Maintenance Mode',
      'coming_soon': 'Coming Soon...',
      'feature_disabled': 'Feature Disabled',
      'permission_required': 'Permission Required',
      'location_permission': 'Location Permission',
      'camera_permission': 'Camera Permission',
      'storage_permission': 'Storage Permission',
      'notification_permission': 'Notification Permission',
      'grant_permission': 'Grant Permission',
      'deny_permission': 'Deny Permission',
    }
  };

  String get currentLanguage => _currentLanguage;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // SharedPreferences'tan dil tercihi yükle
      final prefs = await SharedPreferences.getInstance();
      _currentLanguage = prefs.getString('language') ?? 'tr';

      // Supabase API'den çeviri verilerini yüklemeye çalış
      await _loadFromSupabaseAPI();

      // Eğer Supabase'den yüklenemezse fallback kullan
    } catch (e) {
      debugPrint('Supabase API unavailable, using fallback languages');
      _loadFallbackLanguages();
    }

    _isInitialized = true;
  }

  Future<void> _loadFromSupabaseAPI() async {
    try {
      // Available languages endpoint'i çağır
      final response = await http.get(
        Uri.parse('${DatabaseConfig.apiBaseUrl}/translations/languages'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        _availableLanguages = (data['languages'] as List)
            .map((lang) => LanguageModel.fromJson(lang))
            .toList();
      } else {
        throw Exception('Failed to load languages');
      }
    } catch (e) {
      debugPrint('Failed to load languages from Supabase API: $e');
      // Fallback languages yükle
      _loadFallbackLanguages();
    }
  }

  void _loadFallbackLanguages() {
    _availableLanguages = [
      LanguageModel(
        id: '1',
        name: 'Türkçe',
        nativeName: 'Türkçe',
        flagEmoji: '🇹🇷',
        isActive: true,
        sortOrder: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      LanguageModel(
        id: '2',
        name: 'English',
        nativeName: 'English',
        flagEmoji: '🇺🇸',
        isActive: true,
        sortOrder: 2,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];
  }

  Future<void> loadTranslations(String languageCode) async {
    if (_translationsCache.containsKey(languageCode)) {
      return; // Zaten cache'de var
    }

    try {
      // Supabase API'den çevirileri yükle
      final response = await http.get(
        Uri.parse('${DatabaseConfig.apiBaseUrl}/translations/$languageCode'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        _translationsCache[languageCode] =
            Map<String, String>.from(data['translations']);
      } else {
        // API'den yüklenemezse fallback kullan
        _translationsCache[languageCode] =
            _fallbackTranslations[languageCode] ?? _fallbackTranslations['tr']!;
      }
    } catch (e) {
      debugPrint('Failed to load translations from Supabase API: $e');
      // Fallback çevirileri kullan
      _translationsCache[languageCode] =
          _fallbackTranslations[languageCode] ?? _fallbackTranslations['tr']!;
    }
  }

  Future<void> setLanguage(String languageCode) async {
    if (_currentLanguage == languageCode) return;

    _currentLanguage = languageCode;

    // SharedPreferences'a kaydet
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language', languageCode);

    // Çevirileri yükle
    await loadTranslations(languageCode);
  }

  String translate(String key) {
    final translations = _translationsCache[_currentLanguage];
    if (translations != null && translations.containsKey(key)) {
      return translations[key]!;
    }

    // Current language'da bulunamazsa Türkçe'ye fallback
    final turkishTranslations = _translationsCache['tr'];
    if (turkishTranslations != null && turkishTranslations.containsKey(key)) {
      return turkishTranslations[key]!;
    }

    // Fallback translations'a bak
    final fallbackTranslations = _fallbackTranslations[_currentLanguage];
    if (fallbackTranslations != null && fallbackTranslations.containsKey(key)) {
      return fallbackTranslations[key]!;
    }

    // Son çare olarak Türkçe fallback
    final turkishFallback = _fallbackTranslations['tr'];
    if (turkishFallback != null && turkishFallback.containsKey(key)) {
      return turkishFallback[key]!;
    }

    // Hiçbir yerde bulunamazsa key'i döndür
    return key;
  }

  List<LanguageModel> get availableLanguages => _availableLanguages;

  List<LanguageModel> get languages => _availableLanguages;

  Future<void> reloadTranslations() async {
    _translationsCache.clear();
    await _loadFromSupabaseAPI();
    await loadTranslations(_currentLanguage);
  }

  Future<void> deleteTranslation(String languageId, String key) async {
    try {
      // Supabase API'den translation sil
      await http.delete(
        Uri.parse('${DatabaseConfig.apiBaseUrl}/translations/$languageId/$key'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${_getAuthToken()}',
        },
      );

      // Cache'den sil
      if (_translationsCache.containsKey(languageId)) {
        _translationsCache[languageId]!.remove(key);
      }
    } catch (e) {
      debugPrint('Failed to delete translation: $e');
      throw Exception('Translation could not be deleted');
    }
  }

  Future<void> addTranslation(
      String languageCode, String key, String value) async {
    try {
      // Supabase API'ye translation ekle
      await http.post(
        Uri.parse('${DatabaseConfig.apiBaseUrl}/translations'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${_getAuthToken()}',
        },
        body: json.encode({
          'language_code': languageCode,
          'key': key,
          'value': value,
        }),
      );

      // Cache'i güncelle
      if (!_translationsCache.containsKey(languageCode)) {
        _translationsCache[languageCode] = {};
      }
      _translationsCache[languageCode]![key] = value;
    } catch (e) {
      debugPrint('Failed to add translation: $e');
      throw Exception('Translation could not be added');
    }
  }

  Future<void> updateTranslation(
      String languageCode, String key, String value) async {
    try {
      // Supabase API'de translation güncelle
      await http.put(
        Uri.parse(
            '${DatabaseConfig.apiBaseUrl}/translations/$languageCode/$key'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${_getAuthToken()}',
        },
        body: json.encode({
          'value': value,
        }),
      );

      // Cache'i güncelle
      if (_translationsCache.containsKey(languageCode)) {
        _translationsCache[languageCode]![key] = value;
      }
    } catch (e) {
      debugPrint('Failed to update translation: $e');
      throw Exception('Translation could not be updated');
    }
  }

  String _getAuthToken() {
    // AuthProvider'dan token alınacak
    // Şimdilik boş string döndürüyoruz
    return '';
  }
}
