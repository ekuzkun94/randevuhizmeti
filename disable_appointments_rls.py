#!/usr/bin/env python3
"""
Appointments tablosunda RLS'yi geçici olarak kapat
"""

import requests

# Supabase Configuration
SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc"

def test_appointments_insert():
    """Appointments insert'ini test et"""
    
    print("🔧 Appointments RLS'yi kapatmak için:")
    print("1. Supabase Dashboard'a gidin")
    print("2. SQL Editor'ı açın")
    print("3. Şu komutu çalıştırın:")
    print("   ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;")
    print()
    
    # Test insert
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    test_data = {
        'provider_id': '770e8400-e29b-41d4-a716-446655440001',
        'service_id': '880e8400-e29b-41d4-a716-446655440001',
        'appointment_date': '2025-07-01',
        'appointment_time': '10:00:00',
        'status': 'confirmed',
        'guest_name': 'Test User',
        'guest_email': 'test@example.com',
        'guest_phone': '+90 555 123 4567',
        'notes': 'Test randevu'
    }
    
    print("🧪 Test randevu oluşturuluyor...")
    
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
            
            if "row-level security policy" in response.text:
                print("\n🔒 RLS problemi!")
                print("Supabase Dashboard'da şu komutu çalıştırın:")
                print("ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;")
            
            return False
            
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return False

def check_appointments():
    """Mevcut randevuları kontrol et"""
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/appointments?select=*",
            headers=headers
        )
        
        if response.status_code == 200:
            appointments = response.json()
            print(f"📋 Toplam randevu sayısı: {len(appointments)}")
            
            if appointments:
                print("Son 3 randevu:")
                for appt in appointments[-3:]:
                    print(f"  - {appt.get('guest_name', appt.get('customer_id', 'Unknown'))}: {appt.get('appointment_date')} {appt.get('appointment_time')}")
            
            return len(appointments)
        else:
            print(f"❌ Randevular alınamadı: {response.status_code}")
            return 0
            
    except Exception as e:
        print(f"❌ Hata: {e}")
        return 0

if __name__ == "__main__":
    print("🚀 Appointments RLS Test")
    print("="*40)
    
    # 1. Mevcut durumu kontrol et
    initial_count = check_appointments()
    
    # 2. Test randevu oluşturmaya çalış
    test_success = test_appointments_insert()
    
    if test_success:
        # 3. Yeni durumu kontrol et
        final_count = check_appointments()
        
        if final_count > initial_count:
            print(f"\n🎉 Başarı! {final_count - initial_count} yeni randevu eklendi!")
            print("Flutter uygulaması artık randevu oluşturabilir!")
        else:
            print("\n⚠️  Randevu oluştu ama listede görünmüyor...")
    else:
        print("\n❌ RLS sorunu devam ediyor.")
        print("Manual olarak şu komutu çalıştırın:")
        print("ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;") 