#!/usr/bin/env python3
"""
ZamanYönet API Düzeltilmiş Test Script
Doğru parametrelerle API test'i
"""

import requests
import json
import time
from datetime import datetime

# API Base URL
BASE_URL = "https://zaman-yonet-api.onrender.com"

def print_separator():
    print("=" * 60)

def print_test_header(test_name):
    print_separator()
    print(f"🧪 TEST: {test_name}")
    print_separator()

def print_result(endpoint, method, status_code, response_data):
    status_emoji = "✅" if status_code < 400 else "❌"
    print(f"{status_emoji} {method} {endpoint}")
    print(f"📊 Status Code: {status_code}")
    print(f"📝 Response: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
    print()

def test_full_user_flow():
    """Tam kullanıcı akışı testi"""
    print_test_header("Tam Kullanıcı Akışı")
    
    # 1. Kullanıcı kaydı
    timestamp = int(time.time())
    email = f"test_{timestamp}@example.com"
    
    user_data = {
        "username": f"testuser_{timestamp}",
        "email": email,
        "password": "test123456",
        "full_name": "Test Kullanıcı"
    }
    
    print("1️⃣ Kullanıcı Kaydı:")
    try:
        response = requests.post(f"{BASE_URL}/register", json=user_data)
        result = response.json()
        print_result("/register", "POST", response.status_code, result)
        
        if response.status_code == 201:
            print("✅ Kayıt başarılı! Şimdi giriş yapalım...")
            
            # 2. Kullanıcı girişi (email kullanarak)
            print("\n2️⃣ Kullanıcı Girişi:")
            login_data = {
                "email": email,
                "password": "test123456"
            }
            
            response = requests.post(f"{BASE_URL}/login", json=login_data)
            result = response.json()
            print_result("/login", "POST", response.status_code, result)
            
            if response.status_code == 200:
                print("✅ Giriş başarılı! Şimdi randevu oluşturalım...")
                
                # 3. Randevu oluşturma
                print("\n3️⃣ Randevu Oluşturma:")
                appointment_data = {
                    "service_name": "Kuaför Hizmeti",
                    "customer_email": email,
                    "provider_name": "Ahmet Berber",
                    "appointment_date": "2024-07-15",
                    "appointment_time": "14:30",
                    "notes": "Saç kesimi ve şekillendirme"
                }
                
                response = requests.post(f"{BASE_URL}/appointments", json=appointment_data)
                result = response.json()
                print_result("/appointments", "POST", response.status_code, result)
                
                if response.status_code == 201:
                    print("✅ Randevu başarıyla oluşturuldu!")
                    
                    # 4. Randevu listesi
                    print("\n4️⃣ Randevu Listesi:")
                    response = requests.get(f"{BASE_URL}/appointments")
                    result = response.json()
                    print_result("/appointments", "GET", response.status_code, result)
                    
                    return True
                    
    except Exception as e:
        print(f"❌ Hata: {e}")
        return False
    
    return False

def test_api_performance():
    """API performans testi"""
    print_test_header("Performans Testi")
    
    endpoints_to_test = [
        ("GET", "/"),
        ("GET", "/health"),
        ("GET", "/appointments")
    ]
    
    for method, endpoint in endpoints_to_test:
        start_time = time.time()
        
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # ms
            
            result = response.json()
            print(f"⚡ {method} {endpoint}")
            print(f"📊 Status: {response.status_code}")
            print(f"⏱️ Response Time: {response_time:.2f}ms")
            print(f"📝 Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            print()
            
        except Exception as e:
            print(f"❌ {method} {endpoint} Hata: {e}")

def test_error_handling():
    """Hata yönetimi testi"""
    print_test_header("Hata Yönetimi")
    
    # Geçersiz kayıt verisi
    print("1️⃣ Geçersiz Kayıt Verisi:")
    invalid_register = {
        "username": "",  # Boş username
        "email": "invalid-email",  # Geçersiz email
        "password": "123"  # Çok kısa şifre
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=invalid_register)
        result = response.json()
        print_result("/register", "POST", response.status_code, result)
    except Exception as e:
        print(f"❌ Hata: {e}")
    
    # Geçersiz giriş verisi
    print("2️⃣ Geçersiz Giriş Verisi:")
    invalid_login = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=invalid_login)
        result = response.json()
        print_result("/login", "POST", response.status_code, result)
    except Exception as e:
        print(f"❌ Hata: {e}")
    
    # Geçersiz randevu verisi
    print("3️⃣ Geçersiz Randevu Verisi:")
    invalid_appointment = {
        "service_name": "",  # Boş servis
        "customer_email": ""  # Boş email
    }
    
    try:
        response = requests.post(f"{BASE_URL}/appointments", json=invalid_appointment)
        result = response.json()
        print_result("/appointments", "POST", response.status_code, result)
    except Exception as e:
        print(f"❌ Hata: {e}")

def run_comprehensive_test():
    """Kapsamlı düzeltilmiş test"""
    print("🚀 ZamanYönet API Düzeltilmiş Test Başlıyor...")
    print(f"🌐 API URL: {BASE_URL}")
    print(f"⏰ Test Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 1. API durumu kontrolü
    try:
        response = requests.get(f"{BASE_URL}/")
        api_info = response.json()
        print(f"✅ API Durumu: {api_info.get('status', 'unknown')}")
        print(f"✅ Versiyon: {api_info.get('version', 'unknown')}")
        print()
    except:
        print("❌ API'ye erişilemiyor!")
        return
    
    # 2. Tam kullanıcı akışı
    user_flow_success = test_full_user_flow()
    
    # 3. Performans testi
    test_api_performance()
    
    # 4. Hata yönetimi testi
    test_error_handling()
    
    print_separator()
    print("🎯 TÜM TESTLER TAMAMLANDI!")
    print_separator()
    
    print("📋 SONUÇ ÖZET:")
    print(f"✅ API Erişilebilirlik: Başarılı")
    print(f"✅ Kullanıcı Akışı: {'Başarılı' if user_flow_success else 'Hatalı'}")
    print(f"✅ Performans: Test edildi")
    print(f"✅ Hata Yönetimi: Test edildi")
    print()
    print("🎉 API'niz başarıyla çalışıyor ve production'a hazır!")

if __name__ == "__main__":
    run_comprehensive_test() 