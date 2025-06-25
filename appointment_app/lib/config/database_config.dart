class DatabaseConfig {
  // 🚀 Supabase Production Configuration
  static const String supabaseUrl = 'https://ugmyyphiqoahludwuzpu.supabase.co';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc';

  // 🌐 Local Development API Configuration
  static const String apiBaseUrl = 'http://localhost:5001'; // Local development
  static const String websiteUrl = 'http://localhost:3000';

  // 📱 API Endpoints
  static const String apiHealth = '$apiBaseUrl/health';
  static const String apiRegister = '$apiBaseUrl/register';
  static const String apiLogin = '$apiBaseUrl/login';
  static const String apiLogout = '$apiBaseUrl/logout';
  static const String apiUsers = '$apiBaseUrl/users';
  static const String apiServices = '$apiBaseUrl/services';
  static const String apiProviders = '$apiBaseUrl/providers';
  static const String apiAppointments = '$apiBaseUrl/appointments';
  static const String apiStats = '$apiBaseUrl/stats';

  // 🔧 Connection Settings
  static const int connectionTimeout = 30; // seconds
  static const int readTimeout = 30; // seconds
  static const int maxRetries = 3;
  static const int retryDelay = 2000; // milliseconds

  // 🔒 Security Settings
  static const bool enableHttpLogging = true;
  static const bool validateCertificates = true;
  static const String userAgent = 'ZamanYonet-Mobile/2.0.0';

  // 📊 App Configuration
  static const String appName = 'ZamanYönet';
  static const String appVersion = '2.0.0-supabase';
  static const String supportEmail = 'support@zamanyonet.com';

  // 🎯 Feature Flags
  static const bool enableOfflineMode = true;
  static const bool enablePushNotifications = true;
  static const bool enableAnalytics = true;
  static const bool debugMode = false; // Production: false

  // 💾 Local Storage
  static const String localDbName = 'zamanyonet_local.db';
  static const int localDbVersion = 2;
  static const bool useLocalFallback = true;
}
