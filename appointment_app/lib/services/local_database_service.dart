import 'dart:async';
import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:crypto/crypto.dart';

class LocalDatabaseService {
  static Database? _database;
  static const String _databaseName = 'appointment_app.db';
  static const int _databaseVersion = 1;

  // Singleton pattern
  static final LocalDatabaseService _instance = LocalDatabaseService._internal();
  factory LocalDatabaseService() => _instance;
  LocalDatabaseService._internal();

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), _databaseName);
    
    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await _createTables(db);
    await _insertInitialData(db);
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Database upgrade logic here
  }

  Future<void> _createTables(Database db) async {
    // Users table
    await db.execute('''
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'customer',
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        sync_status INTEGER DEFAULT 0
      )
    ''');

    // Services table
    await db.execute('''
      CREATE TABLE services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL NOT NULL DEFAULT 0.0,
        provider_id TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        sync_status INTEGER DEFAULT 0
      )
    ''');

    // Providers table
    await db.execute('''
      CREATE TABLE providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        user_id TEXT NOT NULL,
        business_name TEXT,
        description TEXT,
        specialization TEXT,
        experience_years INTEGER DEFAULT 0,
        phone TEXT,
        address TEXT,
        city TEXT,
        rating REAL DEFAULT 0.0,
        total_reviews INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        sync_status INTEGER DEFAULT 0
      )
    ''');

    // Appointments table
    await db.execute('''
      CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        customer_id TEXT,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        provider_id TEXT NOT NULL,
        service_id TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        duration INTEGER DEFAULT 30,
        price REAL DEFAULT 0.0,
        payment_method TEXT DEFAULT 'cash_on_service',
        payment_status TEXT DEFAULT 'pending',
        is_guest INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        sync_status INTEGER DEFAULT 0
      )
    ''');

    // Sync queue table
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT,
        created_at TEXT NOT NULL,
        attempts INTEGER DEFAULT 0
      )
    ''');

    // App settings table
    await db.execute('''
      CREATE TABLE app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      )
    ''');
  }

  Future<void> _insertInitialData(Database db) async {
    final now = DateTime.now().toIso8601String();
    
    // Default admin user
    await db.insert('users', {
      'server_id': '1',
      'name': 'Admin User',
      'email': 'admin@example.com',
      'phone': '+90 555 000 0001',
      'password_hash': _hashPassword('admin123'),
      'role': 'admin',
      'created_at': now,
      'sync_status': 1,
    });

    // Default provider user
    await db.insert('users', {
      'server_id': '2',
      'name': 'Ahmet Yılmaz',
      'email': 'ahmet@example.com',
      'phone': '+90 555 000 0002',
      'password_hash': _hashPassword('provider123'),
      'role': 'provider',
      'created_at': now,
      'sync_status': 1,
    });

    // Default customer user
    await db.insert('users', {
      'server_id': '3',
      'name': 'Mehmet Demir',
      'email': 'mehmet@example.com',
      'phone': '+90 555 000 0003',
      'password_hash': _hashPassword('customer123'),
      'role': 'customer',
      'created_at': now,
      'sync_status': 1,
    });

    // Default provider
    await db.insert('providers', {
      'server_id': '1',
      'user_id': '2',
      'business_name': 'Güzellik Salonu',
      'description': 'Profesyonel güzellik hizmetleri',
      'specialization': 'Saç ve Güzellik',
      'experience_years': 5,
      'phone': '+90 555 000 0002',
      'address': 'Merkez Mah. Güzellik Sok. No:15',
      'city': 'İstanbul',
      'rating': 4.5,
      'total_reviews': 89,
      'created_at': now,
      'sync_status': 1,
    });

    await db.insert('providers', {
      'server_id': '2',
      'user_id': '2',
      'business_name': 'Estetik Kliniği',
      'description': 'Modern estetik uygulamaları',
      'specialization': 'Estetik',
      'experience_years': 8,
      'phone': '+90 555 000 0004',
      'address': 'Çevre Mah. Sağlık Cad. No:25',
      'city': 'İstanbul',
      'rating': 4.8,
      'total_reviews': 156,
      'created_at': now,
      'sync_status': 1,
    });

    await db.insert('providers', {
      'server_id': '3',
      'user_id': '2',
      'business_name': 'Fitness Center',
      'description': 'Kişisel antrenörlük hizmetleri',
      'specialization': 'Fitness',
      'experience_years': 3,
      'phone': '+90 555 000 0005',
      'address': 'Spor Mah. Fitness Blv. No:5',
      'city': 'İstanbul',
      'rating': 4.2,
      'total_reviews': 67,
      'created_at': now,
      'sync_status': 1,
    });

    // Default services
    final services = [
      {'server_id': '1', 'name': 'Saç Kesimi', 'description': 'Profesyonel saç kesimi ve şekillendirme', 'duration': 45, 'price': 150.0, 'provider_id': '1'},
      {'server_id': '2', 'name': 'Saç Boyama', 'description': 'Kaliteli boya ile renklendirme', 'duration': 120, 'price': 350.0, 'provider_id': '1'},
      {'server_id': '3', 'name': 'Makyaj', 'description': 'Özel gün makyajı', 'duration': 60, 'price': 200.0, 'provider_id': '1'},
      {'server_id': '4', 'name': 'Botoks', 'description': 'Anti-aging botoks uygulaması', 'duration': 30, 'price': 800.0, 'provider_id': '2'},
      {'server_id': '5', 'name': 'Dolgu', 'description': 'Hyaluronik asit dolgu', 'duration': 45, 'price': 1200.0, 'provider_id': '2'},
      {'server_id': '6', 'name': 'Kişisel Antrenörlük', 'description': '1 saatlik kişisel antrenman', 'duration': 60, 'price': 100.0, 'provider_id': '3'},
      {'server_id': '7', 'name': 'Beslenme Danışmanlığı', 'description': 'Uzman diyetisyen danışmanlığı', 'duration': 30, 'price': 75.0, 'provider_id': '3'},
    ];

    for (var service in services) {
      await db.insert('services', {
        ...service,
        'created_at': now,
        'sync_status': 1,
      });
    }

    // App settings
    await db.insert('app_settings', {
      'key': 'last_sync',
      'value': now,
      'updated_at': now,
    });

    await db.insert('app_settings', {
      'key': 'app_version',
      'value': '1.0.0',
      'updated_at': now,
    });
  }

  String _hashPassword(String password) {
    var bytes = utf8.encode(password);
    var digest = sha256.convert(bytes);
    return digest.toString();
  }

  // CRUD Operations

  // Users
  Future<Map<String, dynamic>?> authenticateUser(String email, String password) async {
    final db = await database;
    final passwordHash = _hashPassword(password);
    
    final result = await db.query(
      'users',
      where: 'email = ? AND password_hash = ? AND is_active = 1',
      whereArgs: [email, passwordHash],
    );

    if (result.isNotEmpty) {
      return result.first;
    }
    return null;
  }

  Future<List<Map<String, dynamic>>> getUsers() async {
    final db = await database;
    return await db.query('users', where: 'is_active = 1');
  }

  Future<int> insertUser(Map<String, dynamic> user) async {
    final db = await database;
    user['created_at'] = DateTime.now().toIso8601String();
    user['sync_status'] = 0; // Needs sync
    return await db.insert('users', user);
  }

  Future<int> updateUser(String id, Map<String, dynamic> user) async {
    final db = await database;
    user['updated_at'] = DateTime.now().toIso8601String();
    user['sync_status'] = 0; // Needs sync
    return await db.update('users', user, where: 'server_id = ?', whereArgs: [id]);
  }

  // Services
  Future<List<Map<String, dynamic>>> getServices() async {
    final db = await database;
    return await db.query('services', where: 'is_active = 1');
  }

  Future<int> insertService(Map<String, dynamic> service) async {
    final db = await database;
    service['created_at'] = DateTime.now().toIso8601String();
    service['sync_status'] = 0;
    return await db.insert('services', service);
  }

  Future<int> updateService(String id, Map<String, dynamic> service) async {
    final db = await database;
    service['updated_at'] = DateTime.now().toIso8601String();
    service['sync_status'] = 0;
    return await db.update('services', service, where: 'server_id = ?', whereArgs: [id]);
  }

  // Providers
  Future<List<Map<String, dynamic>>> getProviders() async {
    final db = await database;
    return await db.query('providers', where: 'is_active = 1');
  }

  Future<int> insertProvider(Map<String, dynamic> provider) async {
    final db = await database;
    provider['created_at'] = DateTime.now().toIso8601String();
    provider['sync_status'] = 0;
    return await db.insert('providers', provider);
  }

  Future<int> updateProvider(String id, Map<String, dynamic> provider) async {
    final db = await database;
    provider['updated_at'] = DateTime.now().toIso8601String();
    provider['sync_status'] = 0;
    return await db.update('providers', provider, where: 'server_id = ?', whereArgs: [id]);
  }

  // Appointments
  Future<List<Map<String, dynamic>>> getAppointments([String? customerId]) async {
    final db = await database;
    if (customerId != null) {
      return await db.query('appointments', 
        where: 'customer_id = ?', 
        whereArgs: [customerId],
        orderBy: 'appointment_date DESC, appointment_time DESC'
      );
    }
    return await db.query('appointments', 
      orderBy: 'appointment_date DESC, appointment_time DESC'
    );
  }

  Future<int> insertAppointment(Map<String, dynamic> appointment) async {
    final db = await database;
    appointment['created_at'] = DateTime.now().toIso8601String();
    appointment['sync_status'] = 0;
    return await db.insert('appointments', appointment);
  }

  Future<int> updateAppointment(String id, Map<String, dynamic> appointment) async {
    final db = await database;
    appointment['updated_at'] = DateTime.now().toIso8601String();
    appointment['sync_status'] = 0;
    return await db.update('appointments', appointment, where: 'server_id = ?', whereArgs: [id]);
  }

  Future<int> deleteAppointment(String id) async {
    final db = await database;
    return await db.delete('appointments', where: 'server_id = ?', whereArgs: [id]);
  }

  // Sync Operations
  Future<void> addToSyncQueue(String tableName, String recordId, String action, [Map<String, dynamic>? data]) async {
    final db = await database;
    await db.insert('sync_queue', {
      'table_name': tableName,
      'record_id': recordId,
      'action': action,
      'data': data != null ? jsonEncode(data) : null,
      'created_at': DateTime.now().toIso8601String(),
      'attempts': 0,
    });
  }

  Future<List<Map<String, dynamic>>> getSyncQueue() async {
    final db = await database;
    return await db.query('sync_queue', orderBy: 'created_at ASC');
  }

  Future<void> clearSyncQueue() async {
    final db = await database;
    await db.delete('sync_queue');
  }

  // Settings
  Future<String?> getSetting(String key) async {
    final db = await database;
    final result = await db.query('app_settings', where: 'key = ?', whereArgs: [key]);
    if (result.isNotEmpty) {
      return result.first['value'] as String?;
    }
    return null;
  }

  Future<void> setSetting(String key, String value) async {
    final db = await database;
    await db.insert(
      'app_settings',
      {
        'key': key,
        'value': value,
        'updated_at': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Database maintenance
  Future<void> resetDatabase() async {
    final db = await database;
    await db.close();
    
    String path = join(await getDatabasesPath(), _databaseName);
    await deleteDatabase(path);
    _database = null;
  }

  Future<Map<String, int>> getDatabaseStats() async {
    final db = await database;
    
    final usersCount = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM users WHERE is_active = 1')) ?? 0;
    final servicesCount = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM services WHERE is_active = 1')) ?? 0;
    final providersCount = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM providers WHERE is_active = 1')) ?? 0;
    final appointmentsCount = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM appointments')) ?? 0;
    final syncQueueCount = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM sync_queue')) ?? 0;

    return {
      'users': usersCount,
      'services': servicesCount,
      'providers': providersCount,
      'appointments': appointmentsCount,
      'sync_queue': syncQueueCount,
    };
  }
} 