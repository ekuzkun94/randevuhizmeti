-- ================================================
-- Customer-User Relations Setup SQL (FIXED VERSION)
-- Supabase SQL Editor'de çalıştırın
-- ================================================

-- 1. CUSTOMER PROFILE TABLOSU OLUŞTUR (sadece yoksa)
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
    membership_level VARCHAR(20) DEFAULT 'standard', -- standard, premium, vip
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLOSUNA CUSTOMER İÇİN KOLONLARI EKLE (sadece yoksa)
DO $$
BEGIN
    -- customer_code kolonu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'customer_code') THEN
        ALTER TABLE users ADD COLUMN customer_code VARCHAR(20) UNIQUE;
    END IF;
    
    -- is_customer kolonu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_customer') THEN
        ALTER TABLE users ADD COLUMN is_customer BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- customer_since kolonu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'customer_since') THEN
        ALTER TABLE users ADD COLUMN customer_since TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. APPOINTMENTS TABLOSUNA EKSİK KOLONLARI EKLE (sadece yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'customer_name') THEN
        ALTER TABLE appointments ADD COLUMN customer_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'customer_email') THEN
        ALTER TABLE appointments ADD COLUMN customer_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'customer_phone') THEN
        ALTER TABLE appointments ADD COLUMN customer_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'duration') THEN
        ALTER TABLE appointments ADD COLUMN duration INTEGER DEFAULT 30;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'price') THEN
        ALTER TABLE appointments ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'payment_method') THEN
        ALTER TABLE appointments ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash_on_service';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'payment_status') THEN
        ALTER TABLE appointments ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'is_guest') THEN
        ALTER TABLE appointments ADD COLUMN is_guest BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'location') THEN
        ALTER TABLE appointments ADD COLUMN location VARCHAR(255);
    END IF;
END $$;

-- 4. İNDEXLER OLUŞTUR (sadece yoksa)
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_customer_code ON customer_profiles(customer_code);
CREATE INDEX IF NOT EXISTS idx_users_customer_code ON users(customer_code);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);

-- 5. CUSTOMER CODE GENERATOR FUNCTION
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    code_num INTEGER;
BEGIN
    -- En son customer kodunu bul
    SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 4) AS INTEGER)), 0) + 1
    INTO code_num
    FROM users 
    WHERE customer_code IS NOT NULL AND customer_code LIKE 'MUS%';
    
    -- Yeni kod oluştur
    new_code := 'MUS' || LPAD(code_num::TEXT, 3, '0');
    
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
        NEW.customer_since := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı users tablosuna bağla (varsa önce sil)
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

-- Trigger'ı users tablosuna bağla (varsa önce sil)
DROP TRIGGER IF EXISTS trigger_auto_customer_profile ON users;
CREATE TRIGGER trigger_auto_customer_profile
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer_profile();

-- 8. UPDATED_AT TRIGGER FOR CUSTOMER_PROFILES (sadece yoksa)
DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at 
    BEFORE UPDATE ON customer_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS POLİTİKALARI (sadece yoksa)
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları kontrol et ve sadece yoksa ekle
DO $$
BEGIN
    -- Customer profile view policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customer_profiles' 
        AND policyname = 'Customers can view own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Customers can view own profile" ON customer_profiles
            FOR SELECT USING (user_id::text = auth.uid()::text)';
    END IF;

    -- Customer profile update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customer_profiles' 
        AND policyname = 'Customers can update own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Customers can update own profile" ON customer_profiles
            FOR UPDATE USING (user_id::text = auth.uid()::text)';
    END IF;

    -- Providers can view customer profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customer_profiles' 
        AND policyname = 'Providers can view customer profiles'
    ) THEN
        EXECUTE 'CREATE POLICY "Providers can view customer profiles" ON customer_profiles
            FOR SELECT USING (
                user_id IN (
                    SELECT DISTINCT customer_id 
                    FROM appointments 
                    WHERE provider_id IN (
                        SELECT id FROM providers WHERE user_id::text = auth.uid()::text
                    )
                )
            )';
    END IF;

    -- Registered customers can create appointments (sadece yoksa)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Registered customers can create appointments'
    ) THEN
        EXECUTE 'CREATE POLICY "Registered customers can create appointments" ON appointments
            FOR INSERT WITH CHECK (
                customer_id::text = auth.uid()::text OR 
                (customer_id IS NULL AND is_guest = true)
            )';
    END IF;

    -- Anonymous users can create guest appointments (sadece yoksa)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Anonymous users can create guest appointments'
    ) THEN
        EXECUTE 'CREATE POLICY "Anonymous users can create guest appointments" ON appointments
            FOR INSERT WITH CHECK (
                auth.uid() IS NULL AND 
                is_guest = true AND 
                customer_id IS NULL
            )';
    END IF;

END $$;

-- 10. MEVCUT USERS'I CUSTOMER OLARAK İŞARETLE
UPDATE users 
SET is_customer = true, 
    customer_since = CURRENT_TIMESTAMP,
    customer_code = generate_customer_code()
WHERE (first_name LIKE 'Müşteri%' OR email LIKE '%musteri%') 
  AND is_customer IS NOT true;

-- 11. EXAMPLE CUSTOMER DATA INSERT
INSERT INTO customer_profiles (user_id, customer_code, preferences, loyalty_points)
SELECT 
    id, 
    customer_code,
    '{"preferred_time": "morning", "notifications": true}'::jsonb,
    0
FROM users 
WHERE is_customer = true
ON CONFLICT (user_id) DO NOTHING;

-- 12. VIEWS OLUŞTUR (varsa yeniden oluştur)
DROP VIEW IF EXISTS customer_details;
CREATE OR REPLACE VIEW customer_details AS
SELECT 
    u.id as user_id,
    COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.email) as name,
    u.email,
    u.phone,
    u.customer_code,
    u.customer_since,
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
    cp.membership_level,
    cp.created_at as profile_created_at,
    cp.updated_at as profile_updated_at
FROM users u
LEFT JOIN customer_profiles cp ON u.id = cp.user_id
WHERE u.is_customer = true;

-- Appointment detayları view'i (varsa yeniden oluştur)
DROP VIEW IF EXISTS appointment_details;
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
    a.*,
    COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.email) as customer_name_from_user,
    u.email as customer_email_from_user,
    u.phone as customer_phone_from_user,
    u.customer_code,
    cp.loyalty_points,
    s.name as service_name,
    s.duration as service_duration,
    s.price as service_price,
    s.category as service_category,
    p.business_name as provider_business_name,
    p.specialization as provider_specialization
FROM appointments a
LEFT JOIN users u ON a.customer_id = u.id
LEFT JOIN customer_profiles cp ON u.id = cp.user_id
LEFT JOIN services s ON a.service_id = s.id
LEFT JOIN providers p ON a.provider_id = p.id;

-- 13. HELPER FUNCTIONS (varsa yeniden oluştur)
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
        COALESCE(SUM(COALESCE(a.price, 0)), 0) as total_spent,
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

-- 14. KONTROL VE RAPOR
-- Tablo yapılarını kontrol et
SELECT 
    'TABLE STRUCTURE CHECK' as check_type,
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
    'CUSTOMER COUNT' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_customer = true THEN 1 END) as customers,
    COUNT(CASE WHEN customer_code IS NOT NULL THEN 1 END) as users_with_code
FROM users;

-- Customer profiles sayısını kontrol et
SELECT 
    'PROFILES COUNT' as check_type,
    COUNT(*) as customer_profiles_count 
FROM customer_profiles;

-- Appointments tablo yapısını kontrol et
SELECT 
    'APPOINTMENTS INFO' as check_type,
    COUNT(*) as appointments_count,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as appointments_with_customer_id,
    COUNT(CASE WHEN is_guest = true THEN 1 END) as guest_appointments
FROM appointments;

-- Politikaları kontrol et
SELECT 
    'POLICIES CHECK' as check_type,
    tablename, 
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename IN ('appointments', 'customer_profiles')
ORDER BY tablename, policyname;

COMMIT;

-- ================================================
-- KULLANIM ÖRNEĞİ
-- ================================================
/*
-- Test customer oluşturma:
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_customer)
VALUES (uuid_generate_v4(), 'test@email.com', 'hash', 'Test', 'Customer', '+90 555 123 4567', true);

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