import requests
import json
import os
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"

# Headers for API requests
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "apikey": SERVICE_ROLE_KEY
}

def create_staff_table():
    """Create the staff table in Supabase"""
    print("Creating staff table...")
    
    # SQL to create staff table
    sql = """
    -- Staff tablosu - Her provider'da çalışan kişileri tutar
    CREATE TABLE IF NOT EXISTS public.staff (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      provider_id uuid NOT NULL,
      user_id uuid,
      first_name character varying(100) NOT NULL,
      last_name character varying(100) NOT NULL,
      position character varying(100) NOT NULL,
      specialization character varying(200),
      experience_years integer DEFAULT 0,
      phone character varying(20),
      email character varying(255),
      bio text,
      photo_url character varying(500),
      rating numeric(3,2) DEFAULT 0.0,
      total_reviews integer DEFAULT 0,
      is_active boolean DEFAULT true,
      is_available boolean DEFAULT true,
      working_hours jsonb,
      created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
      
      CONSTRAINT staff_pkey PRIMARY KEY (id),
      CONSTRAINT staff_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE,
      CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
    );

    -- Staff-Services ilişki tablosu
    CREATE TABLE IF NOT EXISTS public.staff_services (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      staff_id uuid NOT NULL,
      service_id uuid NOT NULL,
      is_primary boolean DEFAULT false,
      experience_level character varying(50) DEFAULT 'intermediate',
      price_modifier numeric(3,2) DEFAULT 1.0,
      is_active boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
      
      CONSTRAINT staff_services_pkey PRIMARY KEY (id),
      CONSTRAINT staff_services_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE,
      CONSTRAINT staff_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
      CONSTRAINT staff_services_unique UNIQUE (staff_id, service_id)
    );

    -- Index'ler
    CREATE INDEX IF NOT EXISTS idx_staff_provider_id ON public.staff USING btree (provider_id);
    CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff USING btree (user_id);
    CREATE INDEX IF NOT EXISTS idx_staff_active ON public.staff USING btree (is_active, is_available);
    CREATE INDEX IF NOT EXISTS idx_staff_position ON public.staff USING btree (position);

    -- Staff-Services index'leri
    CREATE INDEX IF NOT EXISTS idx_staff_services_staff_id ON public.staff_services USING btree (staff_id);
    CREATE INDEX IF NOT EXISTS idx_staff_services_service_id ON public.staff_services USING btree (service_id);
    CREATE INDEX IF NOT EXISTS idx_staff_services_active ON public.staff_services USING btree (is_active);

    -- Updated at trigger'ları
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
    CREATE TRIGGER update_staff_updated_at 
      BEFORE UPDATE ON staff 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_staff_services_updated_at ON staff_services;
    CREATE TRIGGER update_staff_services_updated_at 
      BEFORE UPDATE ON staff_services 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    """
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            json={"sql": sql}
        )
        
        if response.status_code == 200:
            print("✅ Staff table created successfully")
            return True
        else:
            print(f"❌ Error creating staff table: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Exception creating staff table: {e}")
        return False

def get_provider_id():
    """Get the first provider ID from the database"""
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/providers?select=id&limit=1",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return data[0]['id']
        return None
    except Exception as e:
        print(f"❌ Error getting provider ID: {e}")
        return None

def get_service_ids():
    """Get service IDs from the database"""
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/services?select=id,name&is_active=eq.true",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"❌ Error getting service IDs: {e}")
        return []

def add_sample_staff_data():
    """Add sample staff data"""
    print("Adding sample staff data...")
    
    provider_id = get_provider_id()
    if not provider_id:
        print("❌ No provider found. Please create a provider first.")
        return False
    
    # Sample staff data
    staff_data = [
        {
            "provider_id": provider_id,
            "first_name": "Fatma",
            "last_name": "Demir",
            "position": "Kuaför",
            "specialization": "Saç kesimi, boyama, şekillendirme",
            "experience_years": 8,
            "phone": "+90 555 111 2233",
            "email": "fatma@guzelliksalonu.com",
            "bio": "8 yıllık deneyimimle modern saç stilleri konusunda uzmanım. Müşteri memnuniyeti benim için en önemli öncelik.",
            "rating": 4.8,
            "total_reviews": 156,
            "is_active": True,
            "is_available": True
        },
        {
            "provider_id": provider_id,
            "first_name": "Ayşe",
            "last_name": "Kaya",
            "position": "Estetisyen",
            "specialization": "Cilt bakımı, makyaj, epilasyon",
            "experience_years": 5,
            "phone": "+90 555 222 3344",
            "email": "ayse@guzelliksalonu.com",
            "bio": "Cilt sağlığı ve güzellik konusunda uzmanım. Her müşterinin ihtiyacına özel çözümler sunuyorum.",
            "rating": 4.6,
            "total_reviews": 89,
            "is_active": True,
            "is_available": True
        },
        {
            "provider_id": provider_id,
            "first_name": "Mehmet",
            "last_name": "Yılmaz",
            "position": "Masör",
            "specialization": "Terapötik masaj, rahatlatıcı masaj",
            "experience_years": 6,
            "phone": "+90 555 333 4455",
            "email": "mehmet@guzelliksalonu.com",
            "bio": "Profesyonel masaj teknikleri ile stres ve yorgunluğunuzu atın. Vücut sağlığınız için özel programlar.",
            "rating": 4.9,
            "total_reviews": 203,
            "is_active": True,
            "is_available": True
        }
    ]
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/staff",
            headers=headers,
            json=staff_data
        )
        
        if response.status_code == 201:
            print("✅ Sample staff data added successfully")
            return response.json()
        else:
            print(f"❌ Error adding staff data: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Exception adding staff data: {e}")
        return None

def add_staff_services_relationships():
    """Add staff-services relationships"""
    print("Adding staff-services relationships...")
    
    # Get staff members
    try:
        staff_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/staff?select=id,first_name,last_name,position",
            headers=headers
        )
        
        if staff_response.status_code != 200:
            print("❌ Error getting staff data")
            return False
            
        staff_members = staff_response.json()
    except Exception as e:
        print(f"❌ Error getting staff data: {e}")
        return False
    
    # Get services
    services = get_service_ids()
    if not services:
        print("❌ No services found")
        return False
    
    # Create service name to ID mapping
    service_map = {service['name']: service['id'] for service in services}
    
    # Staff-services relationships
    relationships = []
    
    for staff in staff_members:
        staff_id = staff['id']
        position = staff['position']
        
        if position == "Kuaför":
            # Fatma Demir - Saç hizmetleri
            if "Saç Kesimi" in service_map:
                relationships.append({
                    "staff_id": staff_id,
                    "service_id": service_map["Saç Kesimi"],
                    "is_primary": True,
                    "experience_level": "expert",
                    "price_modifier": 1.0,
                    "is_active": True
                })
            
            if "Saç Boyama" in service_map:
                relationships.append({
                    "staff_id": staff_id,
                    "service_id": service_map["Saç Boyama"],
                    "is_primary": True,
                    "experience_level": "expert",
                    "price_modifier": 1.1,
                    "is_active": True
                })
            
            if "Saç Şekillendirme" in service_map:
                relationships.append({
                    "staff_id": staff_id,
                    "service_id": service_map["Saç Şekillendirme"],
                    "is_primary": False,
                    "experience_level": "intermediate",
                    "price_modifier": 1.0,
                    "is_active": True
                })
                
        elif position == "Estetisyen":
            # Ayşe Kaya - Cilt bakımı hizmetleri
            if "Cilt Bakımı" in service_map:
                relationships.append({
                    "staff_id": staff_id,
                    "service_id": service_map["Cilt Bakımı"],
                    "is_primary": True,
                    "experience_level": "expert",
                    "price_modifier": 1.0,
                    "is_active": True
                })
            
            if "Makyaj" in service_map:
                relationships.append({
                    "staff_id": staff_id,
                    "service_id": service_map["Makyaj"],
                    "is_primary": True,
                    "experience_level": "expert",
                    "price_modifier": 1.2,
                    "is_active": True
                })
            
            if "Epilasyon" in service_map:
                relationships.append({
                    "staff_id": staff_id,
                    "service_id": service_map["Epilasyon"],
                    "is_primary": False,
                    "experience_level": "intermediate",
                    "price_modifier": 1.0,
                    "is_active": True
                })
                
        elif position == "Masör":
            # Mehmet Yılmaz - Masaj hizmetleri
            if "Terapötik Masaj" in service_map:
                relationships.append({
                    "staff_id": staff_id,
                    "service_id": service_map["Terapötik Masaj"],
                    "is_primary": True,
                    "experience_level": "expert",
                    "price_modifier": 1.0,
                    "is_active": True
                })
            
            if "Rahatlatıcı Masaj" in service_map:
                relationships.append({
                    "staff_id": staff_id,
                    "service_id": service_map["Rahatlatıcı Masaj"],
                    "is_primary": True,
                    "experience_level": "expert",
                    "price_modifier": 1.1,
                    "is_active": True
                })
    
    if not relationships:
        print("❌ No relationships to add")
        return False
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/staff_services",
            headers=headers,
            json=relationships
        )
        
        if response.status_code == 201:
            print(f"✅ Added {len(relationships)} staff-service relationships")
            return True
        else:
            print(f"❌ Error adding relationships: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Exception adding relationships: {e}")
        return False

def create_views_and_functions():
    """Create views and functions for staff management"""
    print("Creating views and functions...")
    
    sql = """
    -- View: Staff ile birlikte sundukları hizmetleri gösteren view
    CREATE OR REPLACE VIEW public.staff_with_services AS
    SELECT 
      s.id as staff_id,
      s.first_name,
      s.last_name,
      s.position,
      s.specialization,
      s.experience_years,
      s.phone,
      s.email,
      s.bio,
      s.rating,
      s.total_reviews,
      s.is_active,
      s.is_available,
      s.provider_id,
      p.business_name as provider_name,
      array_agg(
        json_build_object(
          'service_id', svc.id,
          'service_name', svc.name,
          'service_description', svc.description,
          'service_price', svc.price,
          'service_duration', svc.duration,
          'is_primary', ss.is_primary,
          'experience_level', ss.experience_level,
          'price_modifier', ss.price_modifier,
          'staff_service_price', svc.price * ss.price_modifier
        )
      ) as services
    FROM public.staff s
    LEFT JOIN public.providers p ON s.provider_id = p.id
    LEFT JOIN public.staff_services ss ON s.id = ss.staff_id
    LEFT JOIN public.services svc ON ss.service_id = svc.id
    WHERE s.is_active = true AND (ss.is_active = true OR ss.is_active IS NULL)
    GROUP BY s.id, s.first_name, s.last_name, s.position, s.specialization, s.experience_years, 
             s.phone, s.email, s.bio, s.rating, s.total_reviews, s.is_active, s.is_available, 
             s.provider_id, p.business_name;

    -- Function: Belirli bir hizmeti sunan staff üyelerini getir
    CREATE OR REPLACE FUNCTION get_staff_by_service(service_name_param text)
    RETURNS TABLE (
      staff_id uuid,
      first_name text,
      last_name text,
      position text,
      rating numeric,
      experience_level text,
      price_modifier numeric
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        s.id,
        s.first_name,
        s.last_name,
        s.position,
        s.rating,
        ss.experience_level,
        ss.price_modifier
      FROM public.staff s
      INNER JOIN public.staff_services ss ON s.id = ss.staff_id
      INNER JOIN public.services svc ON ss.service_id = svc.id
      WHERE svc.name ILIKE '%' || service_name_param || '%'
        AND s.is_active = true 
        AND ss.is_active = true
      ORDER BY s.rating DESC, ss.is_primary DESC;
    END;
    $$ LANGUAGE plpgsql;

    -- Function: Staff üyesinin sunduğu hizmetleri getir
    CREATE OR REPLACE FUNCTION get_services_by_staff(staff_id_param uuid)
    RETURNS TABLE (
      service_id uuid,
      service_name text,
      service_description text,
      service_price numeric,
      service_duration integer,
      is_primary boolean,
      experience_level text,
      price_modifier numeric,
      staff_service_price numeric
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        svc.id,
        svc.name,
        svc.description,
        svc.price,
        svc.duration,
        ss.is_primary,
        ss.experience_level,
        ss.price_modifier,
        svc.price * ss.price_modifier as staff_service_price
      FROM public.services svc
      INNER JOIN public.staff_services ss ON svc.id = ss.service_id
      WHERE ss.staff_id = staff_id_param
        AND ss.is_active = true
      ORDER BY ss.is_primary DESC, svc.name;
    END;
    $$ LANGUAGE plpgsql;
    """
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            json={"sql": sql}
        )
        
        if response.status_code == 200:
            print("✅ Views and functions created successfully")
            return True
        else:
            print(f"❌ Error creating views and functions: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Exception creating views and functions: {e}")
        return False

def main():
    """Main function to set up staff management"""
    print("🚀 Setting up Staff Management System...")
    print("=" * 50)
    
    # Step 1: Create staff table
    if not create_staff_table():
        print("❌ Failed to create staff table")
        return
    
    # Step 2: Add sample staff data
    staff_data = add_sample_staff_data()
    if not staff_data:
        print("❌ Failed to add sample staff data")
        return
    
    # Step 3: Add staff-services relationships
    if not add_staff_services_relationships():
        print("❌ Failed to add staff-services relationships")
        return
    
    # Step 4: Create views and functions
    if not create_views_and_functions():
        print("❌ Failed to create views and functions")
        return
    
    print("=" * 50)
    print("✅ Staff Management System setup completed successfully!")
    print("\n📋 What was created:")
    print("• Staff table with all necessary fields")
    print("• Staff-services junction table")
    print("• Sample staff data (3 staff members)")
    print("• Staff-services relationships")
    print("• Views and functions for easy querying")
    print("\n🎯 Next steps:")
    print("1. Run the Flutter app")
    print("2. Go to Admin > Staff Management")
    print("3. View, add, edit, and manage staff members")
    print("4. Assign services to staff members")

if __name__ == "__main__":
    main() 