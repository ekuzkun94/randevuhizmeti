-- Staff Tablosu
CREATE TABLE IF NOT EXISTS public.staff (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT NOT NULL,
    specialization TEXT,
    experience_years INTEGER DEFAULT 0,
    phone TEXT,
    email TEXT,
    bio TEXT,
    photo_url TEXT,
    rating REAL DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    working_hours JSONB,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Staff-Service İlişki Tablosu (Staff hangi hizmetleri sunabilir)
CREATE TABLE IF NOT EXISTS public.staff_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_provider_id ON public.staff(provider_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON public.staff(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_services_staff_id ON public.staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service_id ON public.staff_services(service_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_is_active ON public.staff_services(is_active);

-- Sample Staff Data
INSERT INTO public.staff (id, provider_id, user_id, first_name, last_name, position, specialization, experience_years, phone, email, bio, rating, total_reviews, is_active, is_available) VALUES
-- Güzellik Salonu Staff
('aa0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'Ayşe', 'Yılmaz', 'Kuaför', 'Saç Kesimi ve Boyama', 8, '+90 555 000 0002', 'ayse@guzellik.com', '8 yıllık deneyimli kuaför', 4.8, 156, true, true),
('aa0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', NULL, 'Fatma', 'Demir', 'Manikür Uzmanı', 'El ve Ayak Bakımı', 5, '+90 555 000 0003', 'fatma@guzellik.com', 'Manikür ve pedikür uzmanı', 4.6, 89, true, true),

-- Spa Merkezi Staff
('aa0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'Mehmet', 'Demir', 'Masaj Terapisti', 'Masaj ve Terapi', 10, '+90 555 000 0004', 'mehmet@spa.com', '10 yıllık masaj terapisti', 4.9, 234, true, true),
('aa0e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', NULL, 'Zeynep', 'Kaya', 'Cilt Bakım Uzmanı', 'Cilt Bakımı ve Masaj', 6, '+90 555 000 0005', 'zeynep@spa.com', 'Cilt bakımı ve aromaterapi uzmanı', 4.7, 112, true, true),

-- Berber Dükkanı Staff
('aa0e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'Ali', 'Kaya', 'Berber', 'Saç ve Sakal Tıraşı', 12, '+90 555 000 0006', 'ali@berber.com', '12 yıllık deneyimli berber', 4.8, 189, true, true),
('aa0e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440003', NULL, 'Hasan', 'Özkan', 'Berber', 'Modern Saç Tasarımı', 7, '+90 555 000 0007', 'hasan@berber.com', 'Modern saç tasarımı uzmanı', 4.5, 95, true, true);

-- Staff-Service İlişkileri
INSERT INTO public.staff_services (staff_id, service_id, is_active) VALUES
-- Güzellik Salonu Staff Services
('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', true), -- Ayşe - Saç Kesimi
('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', true), -- Ayşe - Saç Boyama
('aa0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440003', true), -- Fatma - Manikür
('aa0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440004', true), -- Fatma - Pedikür

-- Spa Merkezi Staff Services
('aa0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440005', true), -- Mehmet - Masaj Terapisi
('aa0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440006', true), -- Mehmet - Aromaterapi
('aa0e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440007', true), -- Zeynep - Cilt Bakımı
('aa0e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440006', true), -- Zeynep - Aromaterapi

-- Berber Dükkanı Staff Services
('aa0e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440008', true), -- Ali - Erkek Saç Kesimi
('aa0e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440009', true), -- Ali - Sakal Tıraşı
('aa0e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440010', true), -- Ali - Saç-Sakal Paketi
('aa0e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440008', true), -- Hasan - Erkek Saç Kesimi
('aa0e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440009', true); -- Hasan - Sakal Tıraşı 