#!/usr/bin/env python3
"""
Appointments tablosunu Flutter koduna uygun hale getir
"""

import requests
import json

# Supabase Configuration
SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"

def update_appointments_table():
    """Appointments tablosuna eksik field'ları ekle"""
    
    print("📋 Appointments tablosunu güncelleniyor...")
    
    # SQL komutları
    alter_commands = [
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);", 
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30;",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.0;",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash_on_service';",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;",
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location VARCHAR(255);"
    ]
    
    # RLS politika komutları
    policy_commands = [
        """CREATE POLICY "Allow appointment creation" ON appointments 
           FOR INSERT WITH CHECK (true);""",
        """CREATE POLICY "Allow appointment updates" ON appointments 
           FOR UPDATE USING (true);"""
    ]
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    
    success_count = 0
    
    # ALTER komutlarını çalıştır
    for i, command in enumerate(alter_commands, 1):
        try:
            # Supabase'e doğrudan SQL çalıştırma REST API'si yok
            # Bu yüzden manuel olarak çalıştırılması gerekiyor
            print(f"   {i}. {command}")
            success_count += 1
        except Exception as e:
            print(f"❌ Hata: {e}")
    
    # RLS politika komutlarını çalıştır  
    for i, command in enumerate(policy_commands, 1):
        try:
            print(f"   RLS {i}. {command}")
            success_count += 1
        except Exception as e:
            print(f"❌ Hata: {e}")
    
    print(f"\n✅ {success_count} komut hazırlandı")
    print("\n📋 MANUAL STEPS REQUIRED:")
    print("1. Supabase Dashboard'a gidin: https://supabase.com/dashboard")
    print("2. Projenizi seçin")
    print("3. SQL Editor'ı açın")
    print("4. Aşağıdaki komutları tek tek çalıştırın:\n")
    
    print("-- ADD COLUMNS")
    for cmd in alter_commands:
        print(cmd)
    
    print("\n-- ADD RLS POLICIES")
    for cmd in policy_commands:
        print(cmd)
    
    print("\n🎯 Bu komutları çalıştırdıktan sonra Flutter uygulaması randevu oluşturabilecek!")

def test_appointments_table():
    """Appointments tablosunun güncel yapısını kontrol et"""
    
    print("🔍 Appointments tablosu test ediliyor...")
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Test insert
    test_data = {
        'customer_name': 'Test User',
        'customer_email': 'test@example.com',
        'customer_phone': '+90 555 123 4567',
        'provider_id': '770e8400-e29b-41d4-a716-446655440001',
        'service_id': '880e8400-e29b-41d4-a716-446655440001',
        'appointment_date': '2025-07-01',
        'appointment_time': '10:00:00',
        'duration': 45,
        'price': 150.0,
        'payment_method': 'cash_on_service',
        'payment_status': 'pending',
        'is_guest': False,
        'status': 'confirmed'
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/appointments",
            headers=headers,
            json=test_data
        )
        
        if response.status_code == 201:
            print("✅ Test randevu başarıyla oluşturuldu!")
            print(f"📋 Response: {response.json()}")
            return True
        else:
            print(f"❌ Test başarısız: HTTP {response.status_code}")
            print(f"📋 Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Appointments Table Update Script")
    print("="*50)
    
    # 1. Güncellemeleri hazırla
    update_appointments_table()
    
    print("\n" + "="*50)
    print("Yukarıdaki SQL komutlarını Supabase'de çalıştırdıktan sonra")
    print("bu script'i tekrar çalıştırarak test edin:")
    print("python update_appointments_table.py test")
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        print("\n🧪 TEST MODU")
        print("="*30)
        test_appointments_table() 