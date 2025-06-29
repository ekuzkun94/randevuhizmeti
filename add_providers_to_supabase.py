#!/usr/bin/env python3
"""
Supabase'e Provider Verilerini Ekle
"""

import requests
import json
from datetime import datetime
import uuid

# Supabase Configuration
SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"

def add_providers_to_supabase():
    """Provider verilerini Supabase'e ekle"""
    
    # Provider verileri (Supabase tablo yapısına uygun)
    providers = [
        {
            "id": str(uuid.uuid4()),
            "business_name": "Elite Beauty Salon",
            "bio": "Lüks güzellik ve bakım hizmetleri",
            "specialization": "Saç, Cilt Bakımı",
            "experience_years": 8,
            "address": "Nişantaşı, İstanbul",
            "city": "İstanbul",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "business_name": "Modern Men's Barber",
            "bio": "Erkek kuaförlük ve sakal bakım uzmanı",
            "specialization": "Saç, Sakal",
            "experience_years": 5,
            "address": "Beşiktaş, İstanbul",
            "city": "İstanbul",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "business_name": "Wellness Spa Center",
            "bio": "Masaj ve terapi merkezi",
            "specialization": "Masaj, Spa",
            "experience_years": 10,
            "address": "Kadıköy, İstanbul",
            "city": "İstanbul",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "business_name": "Beauty Care Clinic",
            "bio": "El-ayak bakımı ve manikür uzmanı",
            "specialization": "El-Ayak Bakımı",
            "experience_years": 6,
            "address": "Şişli, İstanbul",
            "city": "İstanbul",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "business_name": "Skin Care Expert",
            "bio": "Cilt bakımı ve tedavi uzmanı",
            "specialization": "Cilt Bakımı",
            "experience_years": 12,
            "address": "Bakırköy, İstanbul",
            "city": "İstanbul",
            "is_active": True
        }
    ]
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    
    print("🚀 Supabase'e provider verileri ekleniyor...")
    
    # Her provider'ı tek tek ekle
    success_count = 0
    for provider in providers:
        try:
            response = requests.post(
                f'{SUPABASE_URL}/rest/v1/providers',
                headers=headers,
                json=provider,
                timeout=10
            )
            
            if response.status_code == 201:
                print(f"✅ {provider['business_name']} eklendi")
                success_count += 1
            else:
                print(f"❌ {provider['business_name']} eklenemedi: {response.status_code}")
                print(f"   Hata: {response.text}")
                
        except Exception as e:
            print(f"❌ {provider['business_name']} eklenirken hata: {str(e)}")
    
    print(f"\n🎉 Toplam {success_count}/{len(providers)} provider başarıyla eklendi!")
    
    # Kontrol için provider listesini getir
    try:
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/providers?select=*',
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            providers_data = response.json()
            print(f"\n📋 Veritabanında toplam {len(providers_data)} provider var:")
            for provider in providers_data:
                print(f"   - {provider.get('business_name', 'N/A')} ({provider.get('specialization', 'N/A')})")
        else:
            print(f"❌ Provider listesi kontrol edilemedi: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Provider listesi kontrol edilirken hata: {str(e)}")

if __name__ == '__main__':
    add_providers_to_supabase() 