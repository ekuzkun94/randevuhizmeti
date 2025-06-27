-- =====================================================
-- VERİLERİ SIFIRLA VE YENİ ÖRNEK VERİLER EKLE
-- =====================================================

-- 1. MEVCUT VERİLERİ TEMİZLE (Foreign key constraint'ler nedeniyle sıralı)
-- =====================================================

-- Önce bağımlı tabloları temizle
DELETE FROM public.appointments;
DELETE FROM public.audit_logs;
DELETE FROM public.performance_logs;
DELETE FROM public.security_logs;
DELETE FROM public.system_logs;
DELETE FROM public.working_hours;
DELETE FROM public.shifts;
DELETE FROM public.services;
DELETE FROM public.providers;
DELETE FROM public.users;
DELETE FROM public.roles;

-- 2. ROL TABLOSUNA VERİ EKLE
-- =====================================================
INSERT INTO public.roles (id, name, description, permissions, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'Sistem Yöneticisi', 'admin.*', true),
('550e8400-e29b-41d4-a716-446655440002', 'provider', 'Hizmet Sağlayıcı', 'provider.*', true),
('550e8400-e29b-41d4-a716-446655440003', 'customer', 'Müşteri', 'customer.*', true);

-- 3. KULLANICI TABLOSUNA VERİ EKLE
-- =====================================================
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, role_id, is_active, email_verified) VALUES
-- Admin kullanıcıları
('660e8400-e29b-41d4-a716-446655440001', 'admin@zamanyonet.com', '$2a$10$hashed_password_here', 'Admin', 'User', '+90 555 000 0001', '550e8400-e29b-41d4-a716-446655440001', true, true),

-- Provider kullanıcıları
('660e8400-e29b-41d4-a716-446655440002', 'guzellik@salon.com', '$2a$10$hashed_password_here', 'Ayşe', 'Yılmaz', '+90 555 000 0002', '550e8400-e29b-41d4-a716-446655440002', true, true),
('660e8400-e29b-41d4-a716-446655440003', 'spa@merkezi.com', '$2a$10$hashed_password_here', 'Mehmet', 'Demir', '+90 555 000 0003', '550e8400-e29b-41d4-a716-446655440002', true, true),
('660e8400-e29b-41d4-a716-446655440004', 'berber@dukkani.com', '$2a$10$hashed_password_here', 'Ali', 'Kaya', '+90 555 000 0004', '550e8400-e29b-41d4-a716-446655440002', true, true),

-- Customer kullanıcıları
('660e8400-e29b-41d4-a716-446655440005', 'musteri1@email.com', '$2a$10$hashed_password_here', 'Fatma', 'Özkan', '+90 555 000 0005', '550e8400-e29b-41d4-a716-446655440003', true, true),
('660e8400-e29b-41d4-a716-446655440006', 'musteri2@email.com', '$2a$10$hashed_password_here', 'Ahmet', 'Yıldız', '+90 555 000 0006', '550e8400-e29b-41d4-a716-446655440003', true, true),
('660e8400-e29b-41d4-a716-446655440007', 'musteri3@email.com', '$2a$10$hashed_password_here', 'Zeynep', 'Arslan', '+90 555 000 0007', '550e8400-e29b-41d4-a716-446655440003', true, true);

-- 4. PROVIDER TABLOSUNA VERİ EKLE
-- =====================================================
INSERT INTO public.providers (id, user_id, business_name, specialization, experience_years, city, address, bio, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'Güzellik Salonu', 'Saç ve Güzellik', 5, 'İstanbul', 'Merkez Mah. Güzellik Sok. No:15', 'Profesyonel güzellik hizmetleri sunuyoruz.', true),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'Spa Merkezi', 'Masaj ve Terapi', 8, 'Ankara', 'Çankaya Mah. Spa Cad. No:25', 'Rahatlatıcı spa ve masaj hizmetleri.', true),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'Berber Dükkanı', 'Saç ve Sakal', 3, 'İzmir', 'Konak Mah. Berber Sok. No:8', 'Modern berber hizmetleri.', true);

-- 5. SERVİS TABLOSUNA VERİ EKLE
-- =====================================================
INSERT INTO public.services (id, name, description, duration, price, category, is_active, provider_id) VALUES
-- Güzellik Salonu Hizmetleri
('880e8400-e29b-41d4-a716-446655440001', 'Saç Kesimi', 'Profesyonel saç kesimi ve şekillendirme', 45, 150.00, 'Saç', true, '770e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', 'Saç Boyama', 'Profesyonel saç boyama ve renklendirme', 120, 300.00, 'Saç', true, '770e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440003', 'Manikür', 'El bakımı ve oje uygulaması', 30, 80.00, 'El-Ayak', true, '770e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440004', 'Pedikür', 'Ayak bakımı ve oje uygulaması', 45, 100.00, 'El-Ayak', true, '770e8400-e29b-41d4-a716-446655440001'),

-- Spa Merkezi Hizmetleri
('880e8400-e29b-41d4-a716-446655440005', 'Masaj Terapisi', 'Rahatlatıcı masaj terapisi', 60, 200.00, 'Masaj', true, '770e8400-e29b-41d4-a716-446655440002'),
('880e8400-e29b-41d4-a716-446655440006', 'Aromaterapi', 'Aromatik yağlarla masaj', 90, 250.00, 'Masaj', true, '770e8400-e29b-41d4-a716-446655440002'),
('880e8400-e29b-41d4-a716-446655440007', 'Cilt Bakımı', 'Profesyonel cilt bakımı', 75, 180.00, 'Cilt', true, '770e8400-e29b-41d4-a716-446655440002'),

-- Berber Dükkanı Hizmetleri
('880e8400-e29b-41d4-a716-446655440008', 'Erkek Saç Kesimi', 'Modern erkek saç kesimi', 30, 80.00, 'Saç', true, '770e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440009', 'Sakal Tıraşı', 'Profesyonel sakal tıraşı', 20, 50.00, 'Sakal', true, '770e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440010', 'Saç-Sakal Paketi', 'Saç kesimi + sakal tıraşı', 45, 120.00, 'Paket', true, '770e8400-e29b-41d4-a716-446655440003');

-- 6. ÇALIŞMA SAATLERİ EKLE
-- =====================================================
INSERT INTO public.working_hours (id, provider_id, day_of_week, start_time, end_time, is_active) VALUES
-- Güzellik Salonu (Pazartesi-Cumartesi 09:00-19:00)
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 1, '09:00:00', '19:00:00', true),
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 2, '09:00:00', '19:00:00', true),
('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 3, '09:00:00', '19:00:00', true),
('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 4, '09:00:00', '19:00:00', true),
('990e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', 5, '09:00:00', '19:00:00', true),
('990e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440001', 6, '09:00:00', '19:00:00', true),

-- Spa Merkezi (Pazartesi-Pazar 10:00-22:00)
('990e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440002', 1, '10:00:00', '22:00:00', true),
('990e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440002', 2, '10:00:00', '22:00:00', true),
('990e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440002', 3, '10:00:00', '22:00:00', true),
('990e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440002', 4, '10:00:00', '22:00:00', true),
('990e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440002', 5, '10:00:00', '22:00:00', true),
('990e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440002', 6, '10:00:00', '22:00:00', true),
('990e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440002', 0, '10:00:00', '22:00:00', true),

-- Berber Dükkanı (Salı-Pazar 08:00-20:00)
('990e8400-e29b-41d4-a716-446655440014', '770e8400-e29b-41d4-a716-446655440003', 2, '08:00:00', '20:00:00', true),
('990e8400-e29b-41d4-a716-446655440015', '770e8400-e29b-41d4-a716-446655440003', 3, '08:00:00', '20:00:00', true),
('990e8400-e29b-41d4-a716-446655440016', '770e8400-e29b-41d4-a716-446655440003', 4, '08:00:00', '20:00:00', true),
('990e8400-e29b-41d4-a716-446655440017', '770e8400-e29b-41d4-a716-446655440003', 5, '08:00:00', '20:00:00', true),
('990e8400-e29b-41d4-a716-446655440018', '770e8400-e29b-41d4-a716-446655440003', 6, '08:00:00', '20:00:00', true),
('990e8400-e29b-41d4-a716-446655440019', '770e8400-e29b-41d4-a716-446655440003', 0, '08:00:00', '20:00:00', true);

-- 7. RANDEVU ÖRNEKLERİ EKLE
-- =====================================================
INSERT INTO public.appointments (id, customer_id, provider_id, service_id, appointment_date, appointment_time, status, notes) VALUES
-- Geçmiş randevular
('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '2024-06-25', '14:00:00', 'completed', 'Müşteri memnun kaldı'),
('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440005', '2024-06-26', '16:00:00', 'completed', 'Rahatlatıcı masaj'),
('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440008', '2024-06-27', '10:00:00', 'completed', 'Modern saç kesimi'),

-- Bugünkü randevular
('aa0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, '15:00:00', 'confirmed', 'Saç boyama randevusu'),
('aa0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440006', CURRENT_DATE, '18:00:00', 'confirmed', 'Aromaterapi masajı'),

-- Gelecek randevular
('aa0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440010', CURRENT_DATE + INTERVAL '1 day', '11:00:00', 'pending', 'Saç-sakal paketi'),
('aa0e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440003', CURRENT_DATE + INTERVAL '2 days', '14:30:00', 'pending', 'Manikür randevusu');

-- 8. SİSTEM LOG ÖRNEKLERİ EKLE
-- =====================================================
INSERT INTO public.system_logs (id, level, category, message, user_id, endpoint, method, status_code) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'INFO', 'AUTH', 'Kullanıcı başarıyla giriş yaptı', '660e8400-e29b-41d4-a716-446655440001', '/auth/login', 'POST', 200),
('bb0e8400-e29b-41d4-a716-446655440002', 'INFO', 'APPOINTMENT', 'Yeni randevu oluşturuldu', '660e8400-e29b-41d4-a716-446655440005', '/appointments', 'POST', 201),
('bb0e8400-e29b-41d4-a716-446655440003', 'WARNING', 'SYSTEM', 'Yüksek CPU kullanımı tespit edildi', NULL, '/system/health', 'GET', 200);

-- 9. GÜVENLİK LOG ÖRNEKLERİ EKLE
-- =====================================================
INSERT INTO public.security_logs (id, event_type, severity, user_id, email, endpoint, method, success, reason) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 'LOGIN_SUCCESS', 'low', '660e8400-e29b-41d4-a716-446655440001', 'admin@zamanyonet.com', '/auth/login', 'POST', true, 'Başarılı giriş'),
('cc0e8400-e29b-41d4-a716-446655440002', 'LOGIN_FAILED', 'medium', NULL, 'unknown@email.com', '/auth/login', 'POST', false, 'Geçersiz kimlik bilgileri'),
('cc0e8400-e29b-41d4-a716-446655440003', 'PERMISSION_DENIED', 'high', '660e8400-e29b-41d4-a716-446655440005', 'musteri1@email.com', '/admin/users', 'GET', false, 'Yetkisiz erişim');

-- 10. PERFORMANS LOG ÖRNEKLERİ EKLE
-- =====================================================
INSERT INTO public.performance_logs (id, endpoint, method, user_id, response_time, memory_usage, cpu_usage, db_queries, status_code, response_size) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', '/appointments', 'GET', '660e8400-e29b-41d4-a716-446655440001', 150.5, 52428800, 15.2, 3, 200, 2048),
('dd0e8400-e29b-41d4-a716-446655440002', '/services', 'POST', '660e8400-e29b-41d4-a716-446655440002', 89.3, 52428800, 8.7, 2, 201, 512),
('dd0e8400-e29b-41d4-a716-446655440003', '/providers', 'GET', '660e8400-e29b-41d4-a716-446655440005', 45.1, 52428800, 5.1, 1, 200, 1024);

-- =====================================================
-- VERİ EKLEME TAMAMLANDI
-- =====================================================

-- Kontrol sorguları
SELECT 'Roles' as table_name, COUNT(*) as count FROM public.roles
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Providers' as table_name, COUNT(*) as count FROM public.providers
UNION ALL
SELECT 'Services' as table_name, COUNT(*) as count FROM public.services
UNION ALL
SELECT 'Working Hours' as table_name, COUNT(*) as count FROM public.working_hours
UNION ALL
SELECT 'Appointments' as table_name, COUNT(*) as count FROM public.appointments
UNION ALL
SELECT 'System Logs' as table_name, COUNT(*) as count FROM public.system_logs
UNION ALL
SELECT 'Security Logs' as table_name, COUNT(*) as count FROM public.security_logs
UNION ALL
SELECT 'Performance Logs' as table_name, COUNT(*) as count FROM public.performance_logs; 