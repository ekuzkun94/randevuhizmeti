-- Providers tablosu için RLS politikasını düzelt
-- Bu scripti Supabase SQL Editor'de çalıştırın

-- Herkese providers tablosunu okuma yetkisi ver
CREATE POLICY "Allow public read access to providers" ON providers
    FOR SELECT USING (true);

-- Alternatif: Sadece aktif provider'ları göster
-- CREATE POLICY "Allow public read access to active providers" ON providers
--     FOR SELECT USING (is_active = true);

-- Mevcut provider politikalarını kontrol et
-- SELECT * FROM pg_policies WHERE tablename = 'providers';

-- Eğer sorun devam ederse, tüm RLS politikalarını disable et (geliştirme için)
-- ALTER TABLE providers DISABLE ROW LEVEL SECURITY; 