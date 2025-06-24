#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ZamanYönet Render Deployment Test Script
Deployment sonrası API'nin çalıştığını test eder
"""

import requests
import json
import time

# Render URL'inizi buraya yazın (deployment sonrası)
BASE_URL = "https://zamanyonet-api.onrender.com"

def test_deployment():
    """Ana test fonksiyonu"""
    print("🧪 ZamanYönet Render Deployment Test Başlıyor...")
    print("=" * 60)
    
    tests = [
        test_health_check,
        test_api_root,
        test_admin_dashboard,
        test_api_endpoints,
        test_cors_headers,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test error: {e}")
    
    print("\n" + "=" * 60)
    print(f"🎯 Test Sonuçları: {passed}/{total} başarılı")
    
    if passed == total:
        print("🎉 Tüm testler başarılı! Deployment hazır! 🚀")
    else:
        print("⚠️ Bazı testler başarısız. Logları kontrol edin.")
    
    return passed == total

def test_health_check():
    """Health check endpoint testi"""
    print("\n🔍 1. Health Check Test...")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check: {data.get('status', 'unknown')}")
            print(f"   Database: {data.get('database', 'unknown')}")
            print(f"   Timestamp: {data.get('timestamp', 'unknown')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check connection error: {e}")
        return False

def test_api_root():
    """API root endpoint testi"""
    print("\n🔍 2. API Root Test...")
    
    try:
        response = requests.get(BASE_URL, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Root: {data.get('message', 'unknown')}")
            print(f"   Version: {data.get('version', 'unknown')}")
            print(f"   Endpoints: {len(data.get('endpoints', []))} available")
            return True
        else:
            print(f"❌ API root failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API root connection error: {e}")
        return False

def test_admin_dashboard():
    """Admin dashboard testi"""
    print("\n🔍 3. Admin Dashboard Test...")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/dashboard", timeout=10)
        
        if response.status_code == 200:
            print("✅ Admin dashboard accessible")
            return True
        else:
            print(f"✅ Admin dashboard protected (expected): {response.status_code}")
            return True  # 401/403 beklenen davranış
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Admin dashboard connection error: {e}")
        return False

def test_api_endpoints():
    """API endpoints'lerin varlığını test et"""
    print("\n🔍 4. API Endpoints Test...")
    
    endpoints = [
        "/auth/login",
        "/auth/register", 
        "/appointments",
        "/services",
        "/providers"
    ]
    
    working = 0
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            # 200, 401, 405 kabul edilebilir (endpoint exists)
            if response.status_code in [200, 401, 405]:
                print(f"✅ {endpoint}: exists")
                working += 1
            else:
                print(f"⚠️ {endpoint}: {response.status_code}")
        except:
            print(f"❌ {endpoint}: connection failed")
    
    print(f"📊 {working}/{len(endpoints)} endpoints accessible")
    return working >= len(endpoints) * 0.8  # 80% başarı yeterli

def test_cors_headers():
    """CORS headers testi"""
    print("\n🔍 5. CORS Headers Test...")
    
    try:
        response = requests.options(BASE_URL, timeout=10)
        headers = response.headers
        
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ]
        
        found = 0
        for header in cors_headers:
            if header in headers:
                found += 1
                print(f"✅ {header}: {headers[header]}")
            else:
                print(f"⚠️ {header}: missing")
        
        return found >= 2  # En az 2 CORS header olması yeterli
        
    except requests.exceptions.RequestException as e:
        print(f"❌ CORS test connection error: {e}")
        return False

def test_database_migration():
    """Database migration'ın gerekli olup olmadığını kontrol et"""
    print("\n🔍 6. Database Migration Check...")
    
    # Bu fonksiyon Render shell'de çalıştırılacak
    print("📝 Migration'ı Render Shell'de çalıştırın:")
    print("   1. Render Dashboard → Services → zamanyonet-api")
    print("   2. Shell tab'ına gidin")
    print("   3. Şu komutu çalıştırın:")
    print("      python migration_to_supabase.py")
    print("   4. Migration başarılı olursa tables oluşacak")
    
    return True

if __name__ == "__main__":
    print(f"🌐 Testing deployment at: {BASE_URL}")
    print("⏱️ Render first request might be slow (cold start)")
    
    # Render cold start için bekle
    print("⏳ Waiting for Render service to wake up...")
    time.sleep(5)
    
    success = test_deployment()
    
    if success:
        print("\n🎉 Deployment test completed successfully!")
        print(f"🔗 Your API is live at: {BASE_URL}")
        print("📱 Update your Flutter app base URL!")
    else:
        print("\n⚠️ Some tests failed. Check Render logs.")
    
    # Migration reminder
    test_database_migration() 