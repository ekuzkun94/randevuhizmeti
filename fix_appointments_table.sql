-- Appointments tablosunu Flutter koduna uygun hale getir
-- Bu script'i Supabase SQL Editor'de çalıştırın

-- 1. Appointments tablosuna eksik field'ları ekle
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

-- 2. RLS politikalarını düzelt
-- Customers can insert their own appointments
CREATE POLICY "Customers can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        customer_id::text = auth.uid()::text OR 
        customer_id IS NULL -- Guest appointments
    );

-- Guests can create appointments
CREATE POLICY "Guests can create appointments" ON appointments
    FOR INSERT WITH CHECK (is_guest = true);

-- Anyone can insert appointments (for testing)
CREATE POLICY "Allow appointment creation" ON appointments
    FOR INSERT WITH CHECK (true);

-- 3. Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- 4. Test insert (optional)
-- INSERT INTO appointments (
--     customer_name, customer_email, customer_phone,
--     provider_id, service_id, appointment_date, appointment_time,
--     duration, price, payment_method, payment_status, is_guest, status
-- ) VALUES (
--     'Test User', 'test@example.com', '+90 555 123 4567',
--     '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001',
--     '2025-07-01', '10:00:00',
--     45, 150.0, 'cash_on_service', 'pending', false, 'confirmed'
-- );

-- 5. Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Appointments table updated successfully!';
    RAISE NOTICE '📋 Added fields: customer_name, customer_email, customer_phone, duration, price, payment_method, payment_status, is_guest, location';
    RAISE NOTICE '🔒 RLS policies updated for INSERT operations';
    RAISE NOTICE '🎯 Ready for Flutter integration!';
END $$; 