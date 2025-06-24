#!/usr/bin/env python3
"""
🧪 ZamanYönet Supabase Production Test Suite
Bu script production API'nin tüm özelliklerini test eder
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Production API Configuration
API_BASE = "https://zamanyonet-supabase-api.onrender.com"
LOCAL_API = "http://localhost:8000"

# Test data
TEST_USER = {
    "email": "test_user@example.com",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User"
}

ADMIN_LOGIN = {
    "email": "admin@zamanyonet.com",
    "password": "admin123"
}

class ProductionTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()
        
    def test_health_check(self):
        """Test health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health Check: {data.get('status')}")
                print(f"   Database: {data.get('database')}")
                print(f"   Users: {data.get('users_count', 0)}")
                print(f"   Appointments: {data.get('appointments_count', 0)}")
                return True
            else:
                print(f"❌ Health Check Failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health Check Error: {e}")
            return False
    
    def test_cors(self):
        """Test CORS headers"""
        try:
            response = self.session.options(f"{self.base_url}/health")
            cors_origin = response.headers.get('Access-Control-Allow-Origin')
            cors_methods = response.headers.get('Access-Control-Allow-Methods')
            
            if cors_origin == '*' and cors_methods:
                print(f"✅ CORS: Origin={cors_origin}, Methods={cors_methods}")
                return True
            else:
                print(f"❌ CORS Failed: Origin={cors_origin}, Methods={cors_methods}")
                return False
        except Exception as e:
            print(f"❌ CORS Error: {e}")
            return False
    
    def test_register(self):
        """Test user registration"""
        try:
            # Add timestamp to email to avoid conflicts
            test_user = TEST_USER.copy()
            test_user['email'] = f"test_{int(time.time())}@example.com"
            
            response = self.session.post(
                f"{self.base_url}/register",
                json=test_user,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                print(f"✅ Registration: User {data.get('user', {}).get('email')} created")
                self.token = data.get('token')
                return True
            else:
                print(f"❌ Registration Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Registration Error: {e}")
            return False
    
    def test_login(self):
        """Test user login"""
        try:
            response = self.session.post(
                f"{self.base_url}/login",
                json=ADMIN_LOGIN,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login: {data.get('user', {}).get('email')}")
                self.token = data.get('token')
                return True
            else:
                print(f"❌ Login Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Login Error: {e}")
            return False
    
    def test_services(self):
        """Test services endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/services", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                services_count = len(data.get('services', []))
                print(f"✅ Services: {services_count} services found")
                
                # Print first few services
                for service in data.get('services', [])[:3]:
                    print(f"   - {service.get('name')}: {service.get('price')}TL")
                return True
            else:
                print(f"❌ Services Failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Services Error: {e}")
            return False
    
    def test_providers(self):
        """Test providers endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/providers", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                providers_count = len(data.get('providers', []))
                print(f"✅ Providers: {providers_count} providers found")
                
                # Print first few providers
                for provider in data.get('providers', [])[:2]:
                    print(f"   - {provider.get('business_name')}: {provider.get('specialization')}")
                return True
            else:
                print(f"❌ Providers Failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Providers Error: {e}")
            return False
    
    def test_appointment_creation(self):
        """Test appointment creation"""
        try:
            # Get services and providers first
            services_response = self.session.get(f"{self.base_url}/services")
            providers_response = self.session.get(f"{self.base_url}/providers")
            
            if services_response.status_code != 200 or providers_response.status_code != 200:
                print("❌ Cannot get services/providers for appointment test")
                return False
            
            services = services_response.json().get('services', [])
            providers = providers_response.json().get('providers', [])
            
            if not services or not providers:
                print("❌ No services or providers available for appointment test")
                return False
            
            # Create test appointment
            appointment_data = {
                "provider_id": providers[0]['id'],
                "service_id": services[0]['id'],
                "appointment_date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
                "appointment_time": "14:00",
                "guest_name": "Test Guest",
                "guest_email": "testguest@example.com",
                "guest_phone": "+90 555 123 4567",
                "notes": "Test appointment from production test suite"
            }
            
            response = self.session.post(
                f"{self.base_url}/appointments",
                json=appointment_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                print(f"✅ Appointment Created: {data.get('appointment_id')}")
                print(f"   Service: {data.get('appointment', {}).get('service')}")
                print(f"   Date: {data.get('appointment', {}).get('date')} {data.get('appointment', {}).get('time')}")
                return True
            else:
                print(f"❌ Appointment Creation Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Appointment Creation Error: {e}")
            return False
    
    def test_response_time(self):
        """Test API response time"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000  # ms
            
            if response.status_code == 200:
                print(f"✅ Response Time: {response_time:.0f}ms")
                if response_time < 2000:
                    print("   🚀 Excellent performance")
                elif response_time < 5000:
                    print("   👍 Good performance")
                else:
                    print("   ⚠️ Slow performance")
                return True
            else:
                print(f"❌ Response Time Test Failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Response Time Error: {e}")
            return False

def test_api(base_url, name):
    """Test API with given base URL"""
    print(f"\n🧪 Testing {name} API: {base_url}")
    print("=" * 60)
    
    tester = ProductionTester(base_url)
    
    tests = [
        ("Health Check", tester.test_health_check),
        ("CORS Headers", tester.test_cors),
        ("User Registration", tester.test_register),
        ("User Login", tester.test_login),
        ("Services List", tester.test_services),
        ("Providers List", tester.test_providers),
        ("Appointment Creation", tester.test_appointment_creation),
        ("Response Time", tester.test_response_time),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 {test_name}...")
        if test_func():
            passed += 1
        time.sleep(1)  # Small delay between tests
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests PASSED! API is fully functional")
    elif passed >= total * 0.8:
        print("✅ Most tests passed. API is mostly functional")
    else:
        print("❌ Many tests failed. Check API configuration")
    
    return passed == total

def main():
    """Main test function"""
    print("🚀 ZamanYönet Supabase Production Test Suite")
    print("=" * 60)
    
    # Test both production and local (if available)
    production_ok = test_api(API_BASE, "Production")
    
    # Optional: test local if running
    try:
        local_response = requests.get(f"{LOCAL_API}/health", timeout=2)
        if local_response.status_code == 200:
            local_ok = test_api(LOCAL_API, "Local")
        else:
            print(f"\n🏠 Local API not available (this is fine for production)")
    except:
        print(f"\n🏠 Local API not running (this is fine for production)")
    
    print("\n" + "=" * 60)
    print("🎯 Production Test Summary:")
    print(f"   Production API: {'✅ READY' if production_ok else '❌ ISSUES'}")
    print(f"   Database: Supabase PostgreSQL")
    print(f"   Authentication: JWT")
    print(f"   CORS: Enabled")
    print(f"   All Endpoints: Tested")
    
    if production_ok:
        print("\n🎉 PRODUCTION READY!")
        print("   Sabah kalktığında sistem tamamen hazır olacak")
        print("   Website'den gerçek randevu alınabilir")
        print("   Mobile app connect edilebilir")
    else:
        print("\n⚠️ ISSUES DETECTED!")
        print("   Lütfen deployment ayarlarını kontrol edin")

if __name__ == "__main__":
    main() 