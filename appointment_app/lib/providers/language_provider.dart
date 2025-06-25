import 'package:flutter/material.dart';
import 'package:appointment_app/services/translation_service.dart';
import 'package:appointment_app/models/language_model.dart';

class LanguageProvider extends ChangeNotifier {
  final TranslationService _translationService = TranslationService.instance;

  bool _isInitialized = false;
  List<LanguageModel> _availableLanguages = [];
  LanguageModel? _currentLanguage;

  LanguageProvider() {
    initialize();
  }

  bool get isInitialized => _isInitialized;
  List<LanguageModel> get availableLanguages => _availableLanguages;
  LanguageModel? get currentLanguage => _currentLanguage;

  Locale get currentLocale {
    if (_currentLanguage != null) {
      return Locale(_currentLanguage!.id);
    }
    return const Locale('tr');
  }

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      debugPrint('LanguageProvider initializing...');

      // TranslationService'i başlat
      await _translationService.initialize();

      // Mevcut dilleri al
      _availableLanguages = _translationService.languages;

      // Varsayılan dili ayarla (Türkçe)
      _currentLanguage = _availableLanguages.firstWhere(
        (lang) => lang.id == 'tr',
        orElse: () => _availableLanguages.isNotEmpty
            ? _availableLanguages.first
            : _createDefaultLanguage(),
      );

      _isInitialized = true;
      debugPrint(
          'LanguageProvider initialized with ${_availableLanguages.length} languages');
      debugPrint(
          'Available languages: ${_availableLanguages.map((l) => l.name).join(', ')}');
      debugPrint('Current language: ${_currentLanguage?.name ?? 'None'}');

      notifyListeners();
    } catch (e) {
      debugPrint('LanguageProvider initialization error: $e');

      // Fallback durumu
      _availableLanguages = [
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

      _currentLanguage = _availableLanguages.first;
      _isInitialized = true;

      notifyListeners();
    }
  }

  LanguageModel _createDefaultLanguage() {
    return LanguageModel(
      id: 'tr',
      name: 'Turkish',
      nativeName: 'Türkçe',
      flagEmoji: '🇹🇷',
      isActive: true,
      sortOrder: 1,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  Future<void> setLanguageById(String languageId) async {
    if (_currentLanguage?.id == languageId) return;

    try {
      final newLanguage = _availableLanguages.firstWhere(
        (lang) => lang.id == languageId,
        orElse: () => _availableLanguages.isNotEmpty
            ? _availableLanguages.first
            : _createDefaultLanguage(),
      );

      _currentLanguage = newLanguage;

      // TranslationService'de dili değiştir
      await _translationService.setLanguage(languageId);

      debugPrint('Language changed to: ${_currentLanguage?.name}');
      notifyListeners();
    } catch (e) {
      debugPrint('Language change error: $e');
    }
  }

  Future<void> setLanguage(LanguageModel language) async {
    await setLanguageById(language.id);
  }

  String translate(String key, {String? fallback}) {
    if (!_isInitialized || _currentLanguage == null) {
      return fallback ?? key;
    }

    return _translationService.translate(key);
  }

  // Kısa versiyon
  String t(String key, {String? fallback}) =>
      translate(key, fallback: fallback);

  Future<void> refreshLanguages() async {
    try {
      await _translationService.reloadTranslations();
      _availableLanguages = _translationService.languages;

      // Mevcut dili güncelle
      if (_currentLanguage != null) {
        _currentLanguage = _availableLanguages.firstWhere(
          (lang) => lang.id == _currentLanguage!.id,
          orElse: () => _availableLanguages.isNotEmpty
              ? _availableLanguages.first
              : _createDefaultLanguage(),
        );
      }

      notifyListeners();
    } catch (e) {
      debugPrint('Language refresh error: $e');
    }
  }

  Future<void> addTranslation(String key, String value) async {
    if (_currentLanguage == null) return;

    try {
      await _translationService.addTranslation(
          _currentLanguage!.id, key, value);
    } catch (e) {
      debugPrint('Add translation error: $e');
    }
  }

  Future<void> updateTranslation(String key, String value) async {
    if (_currentLanguage == null) return;

    try {
      await _translationService.updateTranslation(
          _currentLanguage!.id, key, value);
    } catch (e) {
      debugPrint('Update translation error: $e');
    }
  }

  Future<void> deleteTranslation(String key) async {
    if (_currentLanguage == null) return;

    try {
      await _translationService.deleteTranslation(_currentLanguage!.id, key);
    } catch (e) {
      debugPrint('Delete translation error: $e');
    }
  }
}
