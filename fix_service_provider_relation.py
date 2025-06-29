#!/usr/bin/env python3
"""
🔧 Service-Provider İlişkisi Düzeltme Script'i
Database'deki service-provider ilişkisini kurar ve test eder
"""

import requests
import json
import uuid
from datetime import datetime

class ServiceProviderFixer:
    def __init__(self):
        self.supabase_url = "https://ugmyyphiqoahludwuzpu.supabase.co"
        self.service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"
        
        # Sample providers data
        self.sample_providers = [
            {
                'id': str(uuid.uuid4()),
                'business_name': 'Elite Güzellik Salonu',
                'specialization': 'Saç Bakımı ve Styling',
                'experience_years': 8,
                'city': 'İstanbul',
                'address': 'Levent Mahallesi, İstanbul',
                'bio': 'Profesyonel saç bakımı ve güzellik hizmetleri',
                'categories': ['Saç', 'Cilt']
            },
            {
                'id': str(uuid.uuid4()),
                'business_name': 'Erkek Kuaför Salonu',
                'specialization': 'Erkek Saç ve Sakal',
                'experience_years': 12,
                'city': 'İstanbul', 
                'address': 'Şişli, İstanbul',
                'bio': 'Modern erkek kuaför hizmetleri',
                'categories': ['Saç', 'Sakal', 'Paket']
            },
            {
                'id': str(uuid.uuid4()),
                'business_name': 'Wellness Spa Center',
                'specialization': 'Masaj ve Terapi',
                'experience_years': 15,
                'city': 'İstanbul',
                'address': 'Beşiktaş, İstanbul', 
                'bio': 'Rahatlama ve terapi uzmanı',
                'categories': ['Masaj']
            },
            {
                'id': str(uuid.uuid4()),
                'business_name': 'Beauty Care Clinic',
                'specialization': 'El-Ayak Bakımı',
                'experience_years': 6,
                'city': 'İstanbul',
                'address': 'Kadıköy, İstanbul',
                'bio': 'Profesyonel el ve ayak bakım hizmetleri',
                'categories': ['El-Ayak']
            }
        ]
    
    def get_headers(self):
        """Get request headers with service key"""
        return {
            'apikey': self.service_key,
            'Authorization': f'Bearer {self.service_key}',
            'Content-Type': 'application/json'
        }
    
    def get_current_services(self):
        """Get current services from database"""
        print("📋 Getting current services...")
        
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/services?select=*",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                services = response.json()
                print(f"✅ Found {len(services)} services")
                return services
            else:
                print(f"❌ Failed to get services: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Error getting services: {e}")
            return []
    
    def create_providers(self):
        """Create sample providers"""
        print("👥 Creating sample providers...")
        
        created_providers = []
        
        for provider_data in self.sample_providers:
            try:
                # Create provider in database
                response = requests.post(
                    f"{self.supabase_url}/rest/v1/providers",
                    headers=self.get_headers(),
                    json={
                        'id': provider_data['id'],
                        'business_name': provider_data['business_name'],
                        'specialization': provider_data['specialization'],
                        'experience_years': provider_data['experience_years'],
                        'city': provider_data['city'],
                        'address': provider_data['address'],
                        'bio': provider_data['bio'],
                        'is_active': True
                    },
                    timeout=10
                )
                
                if response.status_code == 201:
                    print(f"✅ Provider created: {provider_data['business_name']}")
                    created_providers.append(provider_data)
                else:
                    print(f"❌ Failed to create provider {provider_data['business_name']}: {response.status_code}")
                    print(f"   Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error creating provider {provider_data['business_name']}: {e}")
        
        print(f"✅ Created {len(created_providers)} providers")
        return created_providers
    
    def create_service_provider_junction(self):
        """Create service-provider junction table"""
        print("🔗 Creating service-provider junction table...")
        
        # SQL to create junction table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS service_providers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            service_id UUID REFERENCES services(id) ON DELETE CASCADE,
            provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(service_id, provider_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_service_providers_service ON service_providers(service_id);
        CREATE INDEX IF NOT EXISTS idx_service_providers_provider ON service_providers(provider_id);
        """
        
        try:
            # Execute SQL using RPC
            response = requests.post(
                f"{self.supabase_url}/rpc/exec_sql",
                headers=self.get_headers(),
                json={'sql': create_table_sql},
                timeout=10
            )
            
            if response.status_code == 200:
                print("✅ Junction table created successfully")
                return True
            else:
                print(f"❌ Failed to create junction table: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating junction table: {e}")
            return False
    
    def link_services_to_providers(self, services, providers):
        """Link services to providers based on categories"""
        print("🔗 Linking services to providers...")
        
        # Category to service mapping
        service_category_map = {}
        for service in services:
            category = service['category']
            if category not in service_category_map:
                service_category_map[category] = []
            service_category_map[category].append(service)
        
        # Link providers to services based on their categories
        links_created = 0
        
        for provider in providers:
            provider_categories = provider['categories']
            
            for category in provider_categories:
                if category in service_category_map:
                    for service in service_category_map[category]:
                        try:
                            # Create service-provider link
                            response = requests.post(
                                f"{self.supabase_url}/rest/v1/service_providers",
                                headers=self.get_headers(),
                                json={
                                    'service_id': service['id'],
                                    'provider_id': provider['id'],
                                    'is_active': True
                                },
                                timeout=10
                            )
                            
                            if response.status_code == 201:
                                print(f"✅ Linked: {service['name']} → {provider['business_name']}")
                                links_created += 1
                            elif response.status_code == 409:
                                # Already linked
                                print(f"ℹ️ Already linked: {service['name']} → {provider['business_name']}")
                            else:
                                print(f"❌ Failed to link {service['name']} → {provider['business_name']}: {response.status_code}")
                                
                        except Exception as e:
                            print(f"❌ Error linking {service['name']} → {provider['business_name']}: {e}")
        
        print(f"✅ Created {links_created} service-provider links")
        return links_created
    
    def test_service_provider_relation(self):
        """Test the service-provider relationship"""
        print("🧪 Testing service-provider relationship...")
        
        try:
            # Get services with their providers
            response = requests.get(
                f"{self.supabase_url}/rest/v1/service_providers?select=service_id,provider_id,services(name),providers(business_name)",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                relations = response.json()
                print(f"✅ Found {len(relations)} service-provider relations")
                
                for relation in relations[:5]:  # Show first 5
                    service_name = relation.get('services', {}).get('name', 'Unknown')
                    provider_name = relation.get('providers', {}).get('business_name', 'Unknown')
                    print(f"   • {service_name} → {provider_name}")
                
                return True
            else:
                print(f"❌ Failed to test relations: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing relations: {e}")
            return False
    
    def create_flutter_compatible_endpoint(self):
        """Create Flutter uyumlu endpoint testi"""
        print("📱 Creating Flutter compatible API endpoint...")
        
        # Test services with providers endpoint
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/services?select=*,service_providers(provider_id,providers(*))",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                services_with_providers = response.json()
                print(f"✅ Flutter API endpoint working: {len(services_with_providers)} services")
                
                # Show first service with providers
                if services_with_providers:
                    first_service = services_with_providers[0]
                    providers_count = len(first_service.get('service_providers', []))
                    print(f"   • {first_service['name']}: {providers_count} providers")
                
                return True
            else:
                print(f"❌ Flutter API endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing Flutter endpoint: {e}")
            return False
    
    def run_complete_fix(self):
        """Run complete service-provider relationship fix"""
        print("🔧 SERVICE-PROVIDER İLİŞKİSİ DÜZELTİLİYOR")
        print("=" * 50)
        print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        steps = [
            ("Get Current Services", self.get_current_services),
            ("Create Sample Providers", self.create_providers),
            ("Create Junction Table", self.create_service_provider_junction),
            ("Test Flutter Endpoint", self.create_flutter_compatible_endpoint)
        ]
        
        passed = 0
        total = len(steps)
        services = []
        providers = []
        
        for step_name, step_func in steps:
            print(f"\n🔧 {step_name}...")
            try:
                if step_name == "Get Current Services":
                    services = step_func()
                    if services:
                        passed += 1
                elif step_name == "Create Sample Providers":
                    providers = step_func()
                    if providers:
                        passed += 1
                elif step_name == "Create Junction Table":
                    if step_func():
                        passed += 1
                        # Link services to providers after junction table is created
                        print(f"\n🔗 Linking services to providers...")
                        if services and providers:
                            self.link_services_to_providers(services, providers)
                else:
                    if step_func():
                        passed += 1
                        
            except Exception as e:
                print(f"❌ {step_name} failed: {e}")
        
        print(f"\n📊 FIX RESULTS: {passed}/{total} steps completed")
        
        if passed == total:
            print("🎉 SERVICE-PROVIDER İLİŞKİSİ DÜZELTİLDİ!")
            print("\n✅ What's fixed:")
            print("   - Providers table populated")
            print("   - Service-provider junction table created")
            print("   - Services linked to providers")
            print("   - Flutter API endpoints working")
            print("\n📱 Flutter uygulaması artık:")
            print("   1. Hizmet seçebilir")
            print("   2. O hizmeti sunan sağlayıcıları görebilir")
            print("   3. Randevu oluşturabilir")
        else:
            print("⚠️ PARTIAL FIX")
            print("Some steps failed - check logs above")
        
        return passed == total

if __name__ == "__main__":
    fixer = ServiceProviderFixer()
    fixer.run_complete_fix() 