#!/usr/bin/env python3
"""
Supabase'e Provider Verilerini Ekleme Scripti
"""

import os
import requests
import json
from datetime import datetime

# Supabase Konfigürasyonu
SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"

def add_providers_to_supabase():
    """Supabase'e provider verilerini ekler"""
    
    print("🚀 Supabase'e provider verileri ekleme başlatılıyor...")
    print(f"📡 URL: {SUPABASE_URL}")
    print("-" * 50)
    
    # Provider verileri
    providers_data = [
        {
            "id": "770e8400-e29b-41d4-a716-446655440001",
            "user_id": "660e8400-e29b-41d4-a716-446655440002",
            "business_name": "Güzellik Salonu",
            "specialization": "Saç ve Güzellik",
            "experience_years": 5,
            "city": "İstanbul",
            "address": "Merkez Mah. Güzellik Sok. No:15",
            "bio": "Profesyonel güzellik hizmetleri sunuyoruz.",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "user_id": "660e8400-e29b-41d4-a716-446655440003",
            "business_name": "Spa Merkezi",
            "specialization": "Masaj ve Terapi",
            "experience_years": 8,
            "city": "Ankara",
            "address": "Çankaya Mah. Spa Cad. No:25",
            "bio": "Rahatlatıcı spa ve masaj hizmetleri.",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "770e8400-e29b-41d4-a716-446655440003",
            "user_id": "660e8400-e29b-41d4-a716-446655440004",
            "business_name": "Berber Dükkanı",
            "specialization": "Saç ve Sakal",
            "experience_years": 3,
            "city": "İzmir",
            "address": "Konak Mah. Berber Sok. No:8",
            "bio": "Modern berber hizmetleri.",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    success_count = 0
    error_count = 0
    
    for provider in providers_data:
        try:
            # Önce mevcut provider'ı kontrol et
            check_url = f"{SUPABASE_URL}/rest/v1/providers?id=eq.{provider['id']}"
            check_response = requests.get(check_url, headers=headers)
            
            if check_response.status_code == 200 and check_response.json():
                print(f"⚠️  {provider['business_name']}: Zaten mevcut")
                continue
            
            # Yeni provider ekle
            url = f"{SUPABASE_URL}/rest/v1/providers"
            response = requests.post(url, headers=headers, json=provider)
            
            if response.status_code in [201, 200]:
                print(f"✅ {provider['business_name']}: Başarıyla eklendi")
                success_count += 1
            else:
                print(f"❌ {provider['business_name']}: Hata - {response.status_code} - {response.text}")
                error_count += 1
                
        except Exception as e:
            print(f"❌ {provider['business_name']}: Hata - {str(e)}")
            error_count += 1
    
    print("-" * 50)
    print(f"📊 Sonuç: {success_count}/{len(providers_data)} provider başarıyla eklendi")
    
    if error_count > 0:
        print(f"⚠️  {error_count} provider eklenemedi. Hataları kontrol edin.")
    else:
        print("🎉 Tüm provider'lar başarıyla eklendi!")

def add_services_to_supabase():
    """Supabase'e service verilerini ekler"""
    
    print("\n🚀 Supabase'e service verileri ekleme başlatılıyor...")
    print("-" * 50)
    
    # Service verileri
    services_data = [
        # Güzellik Salonu Hizmetleri
        {
            "id": "880e8400-e29b-41d4-a716-446655440001",
            "name": "Saç Kesimi",
            "description": "Profesyonel saç kesimi ve şekillendirme",
            "duration": 45,
            "price": 150.00,
            "category": "Saç",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440001",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "880e8400-e29b-41d4-a716-446655440002",
            "name": "Saç Boyama",
            "description": "Profesyonel saç boyama ve renklendirme",
            "duration": 120,
            "price": 300.00,
            "category": "Saç",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440001",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "880e8400-e29b-41d4-a716-446655440003",
            "name": "Manikür",
            "description": "El bakımı ve oje uygulaması",
            "duration": 30,
            "price": 80.00,
            "category": "El-Ayak",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440001",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "880e8400-e29b-41d4-a716-446655440004",
            "name": "Pedikür",
            "description": "Ayak bakımı ve oje uygulaması",
            "duration": 45,
            "price": 100.00,
            "category": "El-Ayak",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440001",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        
        # Spa Merkezi Hizmetleri
        {
            "id": "880e8400-e29b-41d4-a716-446655440005",
            "name": "Masaj Terapisi",
            "description": "Rahatlatıcı masaj terapisi",
            "duration": 60,
            "price": 200.00,
            "category": "Masaj",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440002",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "880e8400-e29b-41d4-a716-446655440006",
            "name": "Aromaterapi",
            "description": "Aromatik yağlarla masaj",
            "duration": 90,
            "price": 250.00,
            "category": "Masaj",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440002",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "880e8400-e29b-41d4-a716-446655440007",
            "name": "Cilt Bakımı",
            "description": "Profesyonel cilt bakımı",
            "duration": 75,
            "price": 180.00,
            "category": "Cilt",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440002",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        
        # Berber Dükkanı Hizmetleri
        {
            "id": "880e8400-e29b-41d4-a716-446655440008",
            "name": "Erkek Saç Kesimi",
            "description": "Modern erkek saç kesimi",
            "duration": 30,
            "price": 80.00,
            "category": "Saç",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440003",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "880e8400-e29b-41d4-a716-446655440009",
            "name": "Sakal Tıraşı",
            "description": "Profesyonel sakal tıraşı",
            "duration": 20,
            "price": 50.00,
            "category": "Sakal",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440003",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "880e8400-e29b-41d4-a716-446655440010",
            "name": "Saç-Sakal Paketi",
            "description": "Saç kesimi + sakal tıraşı",
            "duration": 45,
            "price": 120.00,
            "category": "Paket",
            "is_active": True,
            "provider_id": "770e8400-e29b-41d4-a716-446655440003",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    success_count = 0
    error_count = 0
    
    for service in services_data:
        try:
            # Önce mevcut service'i kontrol et
            check_url = f"{SUPABASE_URL}/rest/v1/services?id=eq.{service['id']}"
            check_response = requests.get(check_url, headers=headers)
            
            if check_response.status_code == 200 and check_response.json():
                print(f"⚠️  {service['name']}: Zaten mevcut")
                continue
            
            # Yeni service ekle
            url = f"{SUPABASE_URL}/rest/v1/services"
            response = requests.post(url, headers=headers, json=service)
            
            if response.status_code in [201, 200]:
                print(f"✅ {service['name']}: Başarıyla eklendi")
                success_count += 1
            else:
                print(f"❌ {service['name']}: Hata - {response.status_code} - {response.text}")
                error_count += 1
                
        except Exception as e:
            print(f"❌ {service['name']}: Hata - {str(e)}")
            error_count += 1
    
    print("-" * 50)
    print(f"📊 Sonuç: {success_count}/{len(services_data)} service başarıyla eklendi")
    
    if error_count > 0:
        print(f"⚠️  {error_count} service eklenemedi. Hataları kontrol edin.")
    else:
        print("🎉 Tüm service'ler başarıyla eklendi!")

if __name__ == "__main__":
    add_providers_to_supabase()
    add_services_to_supabase()
    print("\n🎯 Veri ekleme işlemi tamamlandı!") 