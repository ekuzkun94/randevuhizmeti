import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:appointment_app/providers/auth_provider.dart';
import 'package:appointment_app/providers/language_provider.dart';
import 'package:appointment_app/router.dart';
import 'package:appointment_app/services/translation_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // TranslationService'i başlat
  final translationService = TranslationService();
  await translationService.initialize();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (context) {
            final provider = LanguageProvider();
            // Initialize provider asynchronously
            provider.initialize();
            return provider;
          },
        ),
        ChangeNotifierProvider(
          create: (context) => AuthProvider(),
        ),
      ],
      child: Consumer<LanguageProvider>(
        builder: (context, languageProvider, child) {
          return MaterialApp.router(
            title: 'ZAMANYÖNET',
            debugShowCheckedModeBanner: false,
            routerConfig: router,
            theme: ThemeData(
              primarySwatch: Colors.blue,
              visualDensity: VisualDensity.adaptivePlatformDensity,
              cardTheme: const CardThemeData(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
              ),
            ),
            // Localization desteği
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('tr', 'TR'),
              Locale('en', 'US'),
            ],
            locale: languageProvider.currentLanguage != null 
                ? Locale(languageProvider.currentLanguage!.id)
                : const Locale('tr'),
          );
        },
      ),
    );
  }
} 