class DatabaseConfig {
  // 🚀 Supabase Production Configuration
  static const String supabaseUrl = 'https://ugmyyphiqoahludwuzpu.supabase.co';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTQwNDYxMzIsImV4cCI6MjAwOTYyMjEzMn0.ZhXyYF8ZQ8YmQlYZxZmKQmF8g7_ZqYpFqZmKQmF8g7Q';

  // 🌐 Production API Configuration
  static const String apiBaseUrl =
      'https://zamanyonet-supabase-api.onrender.com';
  static const String websiteUrl = 'https://zamanyonet-website.onrender.com';

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
