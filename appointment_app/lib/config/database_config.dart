class DatabaseConfig {
  // MySQL bağlantı ayarları - Environment variable'lardan alınır
  static String get host => const String.fromEnvironment('DB_HOST', defaultValue: 'localhost');
  static int get port => const int.fromEnvironment('DB_PORT', defaultValue: 3306);
  static String get user => const String.fromEnvironment('DB_USER', defaultValue: 'root');
  static String get password => const String.fromEnvironment('DB_PASSWORD', defaultValue: 'Ent123!');
  static String get database => const String.fromEnvironment('DB_NAME', defaultValue: 'appointment_system');
  
  // Bağlantı havuzu ayarları
  static const int maxConnections = 10;
  static const int connectionTimeout = 30; // saniye
  static const int queryTimeout = 60; // saniye
  
  // SSL ayarları (güvenlik için)
  static const bool useSSL = false;
  static const bool verifyServerCert = false;
  
  // Debug modu
  static const bool debugMode = true;
  
  // Otomatik yeniden bağlanma
  static const bool autoReconnect = true;
  static const int reconnectInterval = 5000; // milisaniye
  static const int maxReconnectAttempts = 3;
} 