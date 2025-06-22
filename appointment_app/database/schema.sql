-- Randevu Sistemi MySQL Veritabanı Şeması

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS appointment_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE appointment_system;

-- Roller tablosu
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_role_id (role_id)
);

-- Hizmetler tablosu
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT DEFAULT 60 COMMENT 'Dakika cinsinden süre',
    price DECIMAL(10,2) DEFAULT 0.00,
    provider_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_provider_id (provider_id)
);

-- Randevular tablosu
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36),
    customer_name VARCHAR(255) COMMENT 'Misafir randevuları için',
    customer_email VARCHAR(255) COMMENT 'Misafir randevuları için',
    customer_phone VARCHAR(20) COMMENT 'Misafir randevuları için',
    provider_id VARCHAR(36) NOT NULL,
    service_id VARCHAR(36) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL COMMENT 'HH:MM formatında',
    notes TEXT,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
    is_guest BOOLEAN DEFAULT FALSE,
    duration INT COMMENT 'Dakika cinsinden süre',
    location VARCHAR(255),
    price DECIMAL(10,2),
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    meeting_link VARCHAR(500) COMMENT 'Online randevular için',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_service_id (service_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status)
);

-- Çalışma saatleri tablosu
CREATE TABLE IF NOT EXISTS working_hours (
    id VARCHAR(36) PRIMARY KEY,
    provider_id VARCHAR(36) NOT NULL,
    day_of_week INT NOT NULL COMMENT '0=Pazar, 1=Pazartesi, ..., 6=Cumartesi',
    start_time VARCHAR(10) NOT NULL COMMENT 'HH:MM formatında',
    end_time VARCHAR(10) NOT NULL COMMENT 'HH:MM formatında',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_provider_day (provider_id, day_of_week),
    INDEX idx_provider_id (provider_id)
);

-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('appointment', 'reminder', 'system', 'payment') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    appointment_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Diller tablosu
CREATE TABLE IF NOT EXISTS languages (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Çeviriler tablosu
CREATE TABLE IF NOT EXISTS translations (
    id VARCHAR(36) PRIMARY KEY,
    language_id VARCHAR(10) NOT NULL,
    translation_key VARCHAR(255) NOT NULL,
    translation_value TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_key_lang (language_id, translation_key),
    INDEX idx_language_id (language_id),
    INDEX idx_translation_key (translation_key),
    INDEX idx_category (category)
);

-- Hizmet sağlayıcıları profil tablosu
CREATE TABLE IF NOT EXISTS providers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    business_name VARCHAR(255),
    description TEXT,
    specialization VARCHAR(255),
    experience_years INT DEFAULT 0,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image VARCHAR(500),
    website VARCHAR(255),
    social_media JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_city (city),
    INDEX idx_rating (rating),
    INDEX idx_is_active (is_active)
);

-- Örnek veriler ekle
INSERT INTO roles (id, name, description) VALUES
('1', 'Admin', 'Sistem yöneticisi'),
('2', 'Provider', 'Hizmet sağlayıcı'),
('3', 'Customer', 'Müşteri')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Örnek admin kullanıcısı (şifre: admin123)
INSERT INTO users (id, name, email, password, role_id) VALUES
('admin-001', 'Admin User', 'admin@example.com', 'admin123', '1')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email);

-- Örnek provider kullanıcısı (şifre: provider123)
INSERT INTO users (id, name, email, password, role_id) VALUES
('provider-001', 'Dr. Ahmet Yılmaz', 'ahmet@example.com', 'provider123', '2')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email);

-- Örnek customer kullanıcısı (şifre: customer123)
INSERT INTO users (id, name, email, password, role_id) VALUES
('customer-001', 'Mehmet Kaya', 'mehmet@example.com', 'customer123', '3')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email);

-- Örnek hizmetler
INSERT INTO services (id, name, description, duration, price, provider_id) VALUES
('service-001', 'Saç Kesimi', 'Profesyonel saç kesimi hizmeti', 30, 50.00, 'provider-001'),
('service-002', 'Saç Boyama', 'Saç boyama ve bakım hizmeti', 120, 150.00, 'provider-001'),
('service-003', 'Saç Bakımı', 'Saç bakım ve şekillendirme', 60, 80.00, 'provider-001')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Örnek çalışma saatleri
INSERT INTO working_hours (id, provider_id, day_of_week, start_time, end_time, is_available) VALUES
('wh-001', 'provider-001', 1, '09:00', '17:00', TRUE), -- Pazartesi
('wh-002', 'provider-001', 2, '09:00', '17:00', TRUE), -- Salı
('wh-003', 'provider-001', 3, '09:00', '17:00', TRUE), -- Çarşamba
('wh-004', 'provider-001', 4, '09:00', '17:00', TRUE), -- Perşembe
('wh-005', 'provider-001', 5, '09:00', '17:00', TRUE), -- Cuma
('wh-006', 'provider-001', 6, '09:00', '15:00', TRUE)  -- Cumartesi
ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time);

-- Örnek randevu
INSERT INTO appointments (id, customer_id, provider_id, service_id, appointment_date, appointment_time, status, notes) VALUES
('app-001', 'customer-001', 'provider-001', 'service-001', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00', 'confirmed', 'İlk randevu')
ON DUPLICATE KEY UPDATE appointment_date = VALUES(appointment_date), appointment_time = VALUES(appointment_time);

-- Örnek provider profilleri
INSERT INTO providers (id, user_id, business_name, description, specialization, experience_years, phone, address, city, rating, total_reviews, is_verified, is_active) VALUES
('prov-001', 'provider-001', 'Ahmet\'s Kuaför Salonu', 'Profesyonel saç kesimi ve bakım hizmetleri. 15 yıllık deneyim.', 'Saç Kesimi ve Bakımı', 15, '+90 555 123 4567', 'Atatürk Cad. No:123 Kadıköy', 'İstanbul', 4.8, 127, TRUE, TRUE)
ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), description = VALUES(description);

-- Ek provider kullanıcıları
INSERT INTO users (id, name, email, password, role_id) VALUES
('provider-002', 'Dr. Elif Demir', 'elif@example.com', 'provider123', '2'),
('provider-003', 'Mehmet Özkan', 'mehmet.ozkan@example.com', 'provider123', '2')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email);

-- Ek provider profilleri
INSERT INTO providers (id, user_id, business_name, description, specialization, experience_years, phone, address, city, rating, total_reviews, is_verified, is_active) VALUES
('prov-002', 'provider-002', 'Dr. Elif Demir Kliniği', 'Estetik ve güzellik hizmetleri. Uzman doktor eşliğinde güvenli uygulamalar.', 'Estetik ve Güzellik', 8, '+90 555 234 5678', 'Bağdat Cad. No:456 Üsküdar', 'İstanbul', 4.9, 89, TRUE, TRUE),
('prov-003', 'provider-003', 'Özkan Fitness Center', 'Kişisel antrenörlük ve fitness koçluğu hizmetleri.', 'Fitness ve Spor', 12, '+90 555 345 6789', 'Nişantaşı Mah. Spor Sok. No:78', 'İstanbul', 4.6, 156, TRUE, TRUE)
ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), description = VALUES(description);

-- Ek hizmetler
INSERT INTO services (id, name, description, duration, price, provider_id) VALUES
('service-004', 'Cilt Bakımı', 'Profesyonel cilt bakım ve temizlik hizmetleri', 90, 200.00, 'provider-002'),
('service-005', 'Botoks Uygulaması', 'Güvenli botoks uygulaması', 45, 800.00, 'provider-002'),
('service-006', 'Kişisel Antrenörlük', '1 saatlik kişisel antrenörlük seansı', 60, 150.00, 'provider-003'),
('service-007', 'Grup Fitness', 'Grup halinde fitness antrenmanı', 45, 75.00, 'provider-003')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Dil verileri
INSERT INTO languages (id, name, native_name, flag_emoji, is_active, sort_order) VALUES
('tr', 'Turkish', 'Türkçe', '🇹🇷', TRUE, 1),
('en', 'English', 'English', '🇺🇸', TRUE, 2)
ON DUPLICATE KEY UPDATE name = VALUES(name), native_name = VALUES(native_name);

-- Türkçe çeviriler
INSERT INTO translations (id, language_id, translation_key, translation_value, category) VALUES
(UUID(), 'tr', 'welcome_to_appointment_system', 'Randevu Sistemine Hoş Geldiniz', 'general'),
(UUID(), 'tr', 'choose_your_role', 'Rolünüzü seçin', 'general'),
(UUID(), 'tr', 'admin', 'Admin', 'roles'),
(UUID(), 'tr', 'admin_description', 'Sistem yönetimi', 'roles'),
(UUID(), 'tr', 'provider', 'Hizmet Sağlayıcı', 'roles'),
(UUID(), 'tr', 'provider_description', 'Randevu yönetimi', 'roles'),
(UUID(), 'tr', 'customer', 'Müşteri', 'roles'),
(UUID(), 'tr', 'customer_description', 'Randevu al', 'roles'),
(UUID(), 'tr', 'guest', 'Misafir', 'roles'),
(UUID(), 'tr', 'guest_description', 'Hızlı randevu', 'roles'),
(UUID(), 'tr', 'continue_to_app', 'Devam Et', 'general'),
(UUID(), 'tr', 'quick_booking', 'Hızlı Randevu', 'general'),
(UUID(), 'tr', 'quick_booking_description', 'Kayıt olmadan hızlı randevu alın', 'general'),
(UUID(), 'tr', 'book_now', 'Şimdi Rezervasyon Yap', 'general'),
(UUID(), 'tr', 'app_title', 'ZAMANYÖNET', 'general'),
(UUID(), 'tr', 'app_subtitle', 'Modern randevu yönetim sistemi', 'general'),
(UUID(), 'tr', 'login', 'Giriş Yap', 'auth'),
(UUID(), 'tr', 'email', 'Email', 'auth'),
(UUID(), 'tr', 'password', 'Şifre', 'auth'),
(UUID(), 'tr', 'email_required', 'Email gerekli', 'validation'),
(UUID(), 'tr', 'password_required', 'Şifre gerekli', 'validation'),
(UUID(), 'tr', 'invalid_credentials', 'Geçersiz email veya şifre', 'auth'),
(UUID(), 'tr', 'login_error', 'Giriş hatası', 'auth'),
(UUID(), 'tr', 'test_users', 'Test Kullanıcıları:', 'auth'),
(UUID(), 'tr', 'logout', 'Çıkış Yap', 'auth')
ON DUPLICATE KEY UPDATE translation_value = VALUES(translation_value);

-- İngilizce çeviriler
INSERT INTO translations (id, language_id, translation_key, translation_value, category) VALUES
(UUID(), 'en', 'welcome_to_appointment_system', 'Welcome to Appointment System', 'general'),
(UUID(), 'en', 'choose_your_role', 'Choose your role', 'general'),
(UUID(), 'en', 'admin', 'Admin', 'roles'),
(UUID(), 'en', 'admin_description', 'System management', 'roles'),
(UUID(), 'en', 'provider', 'Provider', 'roles'),
(UUID(), 'en', 'provider_description', 'Appointment management', 'roles'),
(UUID(), 'en', 'customer', 'Customer', 'roles'),
(UUID(), 'en', 'customer_description', 'Book appointment', 'roles'),
(UUID(), 'en', 'guest', 'Guest', 'roles'),
(UUID(), 'en', 'guest_description', 'Quick booking', 'roles'),
(UUID(), 'en', 'continue_to_app', 'Continue', 'general'),
(UUID(), 'en', 'quick_booking', 'Quick Booking', 'general'),
(UUID(), 'en', 'quick_booking_description', 'Book appointment without registration', 'general'),
(UUID(), 'en', 'book_now', 'Book Now', 'general'),
(UUID(), 'en', 'app_title', 'ZAMANYÖNET', 'general'),
(UUID(), 'en', 'app_subtitle', 'Modern appointment management system', 'general'),
(UUID(), 'en', 'login', 'Login', 'auth'),
(UUID(), 'en', 'email', 'Email', 'auth'),
(UUID(), 'en', 'password', 'Password', 'auth'),
(UUID(), 'en', 'email_required', 'Email is required', 'validation'),
(UUID(), 'en', 'password_required', 'Password is required', 'validation'),
(UUID(), 'en', 'invalid_credentials', 'Invalid email or password', 'auth'),
(UUID(), 'en', 'login_error', 'Login error', 'auth'),
(UUID(), 'en', 'test_users', 'Test Users:', 'auth'),
(UUID(), 'en', 'logout', 'Logout', 'auth')
ON DUPLICATE KEY UPDATE translation_value = VALUES(translation_value); 