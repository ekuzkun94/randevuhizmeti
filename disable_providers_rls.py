#!/usr/bin/env python3
"""
Providers tablosunda RLS'yi geçici olarak kapat
"""

import requests

# Supabase Configuration
SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"

def disable_providers_rls():
    """Providers tablosunda RLS'yi kapat"""
    
    # Supabase'de doğrudan SQL çalıştırmak için PostgreSQL API'sini kullanamıyoruz
    # Ancak manuel olarak Supabase Dashboard > SQL Editor'de şu komutu çalıştırabilirsiniz:
    
    print("🔧 Providers tablosunda RLS'yi kapatmak için:")
    print("1. Supabase Dashboard'a gidin")
    print("2. SQL Editor'ı açın")
    print("3. Şu komutu çalıştırın:")
    print()
    print("   ALTER TABLE providers DISABLE ROW LEVEL SECURITY;")
    print()
    print("Alternatif olarak, okuma politikası ekleyebilirsiniz:")
    print("   CREATE POLICY \"Allow public read access to providers\" ON providers FOR SELECT USING (true);")
    print()
    
    # Test et: anon key ile provider'ları al
    headers = {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc'
    }
    
    print("🧪 Test ediliyor: anon key ile provider erişimi...")
    try:
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/providers?select=*',
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            providers = response.json()
            print(f"✅ Başarılı! {len(providers)} provider bulundu")
            if providers:
                print(f"📋 İlk provider: {providers[0]['business_name']}")
        else:
            print(f"❌ Hata: {response.status_code}")
            print(f"   Cevap: {response.text}")
            
    except Exception as e:
        print(f"❌ Test hatası: {str(e)}")

if __name__ == '__main__':
    disable_providers_rls() 