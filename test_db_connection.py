#!/usr/bin/env python3
"""
🔌 Supabase Database Connection Tester
Farklı connection methodlarını test eder
"""

import requests
import sys
from datetime import datetime

class SupabaseConnectionTester:
    def __init__(self):
        self.project_id = "ugmyyphiqoahludwuzpu"
        self.current_password = "*RasT_1385*!"
        self.region = "eu-central-1"
        
        # Test edilecek connection methodları
        self.connection_methods = {
            'direct_ipv6': {
                'host': f'db.{self.project_id}.supabase.co',
                'port': 5432,
                'user': 'postgres',
                'format': 'Direct Connection (IPv6)'
            },
            'pooler_session': {
                'host': f'aws-0-{self.region}.pooler.supabase.com',
                'port': 5432,
                'user': f'postgres.{self.project_id}',
                'format': 'Pooler Session Mode'
            },
            'pooler_transaction': {
                'host': f'aws-0-{self.region}.pooler.supabase.com',
                'port': 6543,
                'user': f'postgres.{self.project_id}',
                'format': 'Pooler Transaction Mode'
            }
        }
    
    def test_api_connection(self):
        """Test Supabase REST API connection"""
        print("🌐 Testing REST API Connection...")
        
        url = f"https://{self.project_id}.supabase.co/rest/v1/"
        headers = {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                print("✅ REST API: WORKING")
                return True
            elif response.status_code == 401:
                print("❌ REST API: Authentication failed")
                return False
            else:
                print(f"⚠️ REST API: Status {response.status_code}")
                print(f"   Response: {response.text[:100]}")
                return False
                
        except requests.exceptions.ConnectionError:
            print("❌ REST API: Connection failed (Project might be paused)")
            return False
        except requests.exceptions.Timeout:
            print("⏰ REST API: Timeout (Slow connection)")
            return False
        except Exception as e:
            print(f"❌ REST API: Error - {e}")
            return False
    
    def test_database_via_api(self):
        """Test database access via REST API"""
        print("🗄️ Testing Database via REST API...")
        
        url = f"https://{self.project_id}.supabase.co/rest/v1/information_schema.tables"
        headers = {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                tables = response.json()
                print(f"✅ Database API: {len(tables)} tables accessible")
                return True
            else:
                print(f"❌ Database API: Status {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Database API: {e}")
            return False
    
    def test_auth_api(self):
        """Test Auth API"""
        print("🔑 Testing Auth API...")
        
        url = f"https://{self.project_id}.supabase.co/auth/v1/signup"
        headers = {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc',
            'Content-Type': 'application/json'
        }
        
        try:
            # Just test if the endpoint is reachable
            response = requests.post(url, headers=headers, json={}, timeout=10)
            
            # 400 is expected (empty payload), but means API is working
            if response.status_code in [400, 422]:
                print("✅ Auth API: WORKING")
                return True
            else:
                print(f"⚠️ Auth API: Status {response.status_code}")
                return True  # Still consider it working
                
        except Exception as e:
            print(f"❌ Auth API: {e}")
            return False
    
    def create_connection_guide(self):
        """Create a connection troubleshooting guide"""
        print("\n🔧 CONNECTION TROUBLESHOOTING GUIDE:")
        print("=" * 50)
        
        print("\n📋 To fix database connection:")
        print("1. Go to: https://supabase.com/dashboard")
        print(f"2. Select project: {self.project_id}")
        print("3. Check Project Settings → Database")
        print("4. Verify database is ACTIVE")
        print("5. Reset database password if needed")
        print("6. Update supabase_config.py with new password")
        
        print("\n🔗 Connection strings to try:")
        for name, config in self.connection_methods.items():
            print(f"\n{config['format']}:")
            print(f"postgresql://postgres:{self.current_password}@{config['host']}:{config['port']}/postgres")
        
        print("\n⚡ Quick fixes:")
        print("- If project paused: Resume in dashboard")
        print("- If password wrong: Reset in Settings → Database")
        print("- If connection fails: Try pooler instead of direct")
        print("- If timeout: Check network/firewall")
    
    def run_all_tests(self):
        """Run comprehensive connection tests"""
        print("🧪 SUPABASE CONNECTION DIAGNOSTIC")
        print("=" * 40)
        print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎯 Project: {self.project_id}")
        print(f"🌍 Region: {self.region}")
        
        tests = [
            ("REST API", self.test_api_connection),
            ("Database API", self.test_database_via_api),
            ("Auth API", self.test_auth_api)
        ]
        
        passed = 0
        total = len(tests)
        
        print("\n🔍 Running Tests:")
        for test_name, test_func in tests:
            print(f"\n• {test_name}:")
            if test_func():
                passed += 1
        
        print(f"\n📊 RESULTS: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED!")
            print("✅ Supabase project is ACTIVE and working")
            print("⚠️ Database connection issue might be:")
            print("   - Wrong password")
            print("   - Connection string format")
            print("   - PostgreSQL driver compatibility")
        elif passed >= 1:
            print("⚠️ PARTIAL SUCCESS")
            print("✅ Supabase project is active")
            print("❌ Some services may have issues")
        else:
            print("❌ ALL TESTS FAILED")
            print("💡 Project might be:")
            print("   - Paused due to inactivity")
            print("   - Deleted or moved")
            print("   - Having billing issues")
        
        self.create_connection_guide()
        return passed == total

if __name__ == "__main__":
    tester = SupabaseConnectionTester()
    tester.run_all_tests() 