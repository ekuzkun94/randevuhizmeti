-- ================================================
-- Customer-User Relations Setup SQL
-- Supabase SQL Editor'de çalıştırın
-- ================================================

-- 1. CUSTOMER PROFILE TABLOSU OLUŞTUR
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_code VARCHAR(20) UNIQUE NOT NULL, -- MUS001, MUS002 gibi
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    preferences JSONB DEFAULT '{}', -- Müşteri tercihleri
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_appointment_date DATE,
    notes TEXT,
    is_vip BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLOSUNA CUSTOMER İÇİN KOLON EKLE
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS customer_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_customer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_since DATE;

-- 3. APPOINTMENTS TABLOSUNU GÜNCELLEMELERİ
-- Eksik kolonları ekle (eğer yoksa)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash_on_service',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- 4. İNDEXLER OLUŞTUR
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_customer_code ON customer_profiles(customer_code);
CREATE INDEX IF NOT EXISTS idx_users_customer_code ON users(customer_code);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);

-- 5. CUSTOMER CODE GENERATOR FUNCTION
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER;
BEGIN
    -- En son customer kodunu bul
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(customer_code FROM 4) AS INTEGER)), 
        0
    ) + 1 INTO counter
    FROM users 
    WHERE customer_code IS NOT NULL;
    
    -- Yeni kod oluştur
    new_code := 'MUS' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 6. AUTOMATIC CUSTOMER CODE TRIGGER
CREATE OR REPLACE FUNCTION auto_assign_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer customer olarak işaretlenmişse ve kod yoksa
    IF NEW.is_customer = true AND NEW.customer_code IS NULL THEN
        NEW.customer_code := generate_customer_code();
        NEW.customer_since := COALESCE(NEW.customer_since, CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı users tablosuna bağla
DROP TRIGGER IF EXISTS trigger_auto_customer_code ON users;
CREATE TRIGGER trigger_auto_customer_code
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_customer_code();

-- 7. CUSTOMER PROFILE AUTO CREATE TRIGGER
CREATE OR REPLACE FUNCTION auto_create_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer customer olarak işaretlenmişse profile oluştur
    IF NEW.is_customer = true THEN
        INSERT INTO customer_profiles (user_id, customer_code)
        VALUES (NEW.id, NEW.customer_code)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı users tablosuna bağla
DROP TRIGGER IF EXISTS trigger_auto_customer_profile ON users;
CREATE TRIGGER trigger_auto_customer_profile
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer_profile();

-- 8. UPDATED_AT TRIGGER FOR CUSTOMER_PROFILES
CREATE TRIGGER update_customer_profiles_updated_at 
    BEFORE UPDATE ON customer_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS POLİTİKALARI
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Customers can view their own profile
CREATE POLICY "Customers can view own profile" ON customer_profiles
    FOR SELECT USING (user_id::text = auth.uid()::text);

-- Customers can update their own profile
CREATE POLICY "Customers can update own profile" ON customer_profiles
    FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Providers can view customer profiles for their appointments
CREATE POLICY "Providers can view customer profiles" ON customer_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT DISTINCT customer_id 
            FROM appointments 
            WHERE provider_id IN (
                SELECT id FROM providers WHERE user_id::text = auth.uid()::text
            )
        )
    );

-- 10. APPOINTMENTS RLS POLİTİKALARINI GÜNCELLE
-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Customers can create appointments" ON appointments;
DROP POLICY IF EXISTS "Guests can create appointments" ON appointments;
DROP POLICY IF EXISTS "Allow appointment creation" ON appointments;

-- Yeni politikalar
-- Registered customers can create appointments
CREATE POLICY "Registered customers can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        customer_id::text = auth.uid()::text OR 
        (customer_id IS NULL AND is_guest = true)
    );

-- Anonymous users can create guest appointments
CREATE POLICY "Anonymous users can create guest appointments" ON appointments
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL AND 
        is_guest = true AND 
        customer_id IS NULL
    );

-- Customers can view their own appointments
CREATE POLICY "Customers can view own appointments" ON appointments
    FOR SELECT USING (
        customer_id::text = auth.uid()::text OR
        (is_guest = true AND customer_id IS NULL)
    );

-- Providers can view appointments for their services
CREATE POLICY "Providers can view their appointments" ON appointments
    FOR SELECT USING (
        provider_id IN (
            SELECT id FROM providers WHERE user_id::text = auth.uid()::text
        )
    );

-- 11. MEVCUT USERS'I CUSTOMER OLARAK İŞARETLE
UPDATE users 
SET is_customer = true, 
    customer_since = CURRENT_DATE
WHERE role = 'customer' AND is_customer IS NOT true;

-- 12. EXAMPLE CUSTOMER DATA INSERT
-- Mevcut müşterilere örnek profil bilgileri ekle
INSERT INTO customer_profiles (user_id, customer_code, preferences, loyalty_points)
SELECT 
    id, 
    customer_code,
    '{"preferred_time": "morning", "notifications": true}'::jsonb,
    0
FROM users 
WHERE is_customer = true
ON CONFLICT (user_id) DO NOTHING;

-- 13. VIEWS OLUŞTUR
-- Customer bilgilerini birleştiren view
CREATE OR REPLACE VIEW customer_details AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.phone,
    u.customer_code,
    u.customer_since,
    u.is_active as user_active,
    cp.id as profile_id,
    cp.date_of_birth,
    cp.gender,
    cp.address,
    cp.city,
    cp.postal_code,
    cp.emergency_contact_name,
    cp.emergency_contact_phone,
    cp.preferences,
    cp.loyalty_points,
    cp.total_spent,
    cp.last_appointment_date,
    cp.is_vip,
    cp.is_active as profile_active,
    cp.notes,
    cp.created_at as profile_created_at,
    cp.updated_at as profile_updated_at
FROM users u
LEFT JOIN customer_profiles cp ON u.id = cp.user_id
WHERE u.is_customer = true;

-- Appointment detayları view'i
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
    a.*,
    u.name as customer_name_from_user,
    u.email as customer_email_from_user,
    u.phone as customer_phone_from_user,
    u.customer_code,
    cp.loyalty_points,
    cp.is_vip,
    s.name as service_name,
    s.duration as service_duration,
    s.price as service_price,
    s.category as service_category,
    p.business_name as provider_business_name,
    p.specialization as provider_specialization,
    pu.name as provider_user_name
FROM appointments a
LEFT JOIN users u ON a.customer_id = u.id
LEFT JOIN customer_profiles cp ON u.id = cp.user_id
LEFT JOIN services s ON a.service_id = s.id
LEFT JOIN providers p ON a.provider_id = p.id
LEFT JOIN users pu ON p.user_id = pu.id;

-- 14. HELPER FUNCTIONS
-- Customer istatistikleri
CREATE OR REPLACE FUNCTION get_customer_stats(customer_user_id UUID)
RETURNS TABLE (
    total_appointments INTEGER,
    completed_appointments INTEGER,
    cancelled_appointments INTEGER,
    total_spent DECIMAL,
    last_appointment_date DATE,
    favorite_service TEXT,
    favorite_provider TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::INTEGER as completed_appointments,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END)::INTEGER as cancelled_appointments,
        COALESCE(SUM(a.price), 0) as total_spent,
        MAX(a.appointment_date) as last_appointment_date,
        (SELECT s.name FROM appointments aa 
         JOIN services s ON aa.service_id = s.id 
         WHERE aa.customer_id = customer_user_id 
         GROUP BY s.name 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as favorite_service,
        (SELECT p.business_name FROM appointments aa 
         JOIN providers p ON aa.provider_id = p.id 
         WHERE aa.customer_id = customer_user_id 
         GROUP BY p.business_name 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as favorite_provider
    FROM appointments a
    WHERE a.customer_id = customer_user_id;
END;
$$ LANGUAGE plpgsql;

-- 15. TEST VERİLERİ VE DOĞRULAMA
-- Tablo yapılarını kontrol et
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'customer_profiles', 'appointments')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Customer sayısını kontrol et
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_customer = true THEN 1 END) as customers,
    COUNT(CASE WHEN customer_code IS NOT NULL THEN 1 END) as users_with_code
FROM users;

-- Customer profiles sayısını kontrol et
SELECT COUNT(*) as customer_profiles_count FROM customer_profiles;

-- Appointments tablo yapısını kontrol et
SELECT COUNT(*) as appointments_count FROM appointments;

COMMIT;

-- ================================================
-- KULLANIM ÖRNEĞİ
-- ================================================
/*
-- Yeni customer oluşturma:
INSERT INTO users (id, name, email, phone, role, is_customer)
VALUES (uuid_generate_v4(), 'Ahmet Yılmaz', 'ahmet@email.com', '+90 555 123 4567', 'customer', true);

-- Customer profil güncelleme:
UPDATE customer_profiles 
SET date_of_birth = '1990-05-15',
    gender = 'male',
    city = 'İstanbul',
    preferences = '{"preferred_time": "afternoon", "language": "tr"}'::jsonb
WHERE user_id = 'user_id_here';

-- Customer istatistikleri görme:
SELECT * FROM get_customer_stats('user_id_here');

-- Appointment oluştururken customer_id set etme:
INSERT INTO appointments (
    customer_id, provider_id, service_id, 
    appointment_date, appointment_time, 
    status, is_guest
) VALUES (
    'customer_user_id', 'provider_id', 'service_id',
    '2025-07-01', '10:00', 'confirmed', false
);
*/ 