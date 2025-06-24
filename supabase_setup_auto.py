#!/usr/bin/env python3
"""
🚀 ZamanYönet Supabase Otomatik Setup
Bu script Supabase database'inizi tamamen hazırlar:
- Tüm tabloları oluşturur
- Index'leri ekler
- Default data'yı yükler
- RLS policies'leri aktive eder
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import bcrypt
from datetime import datetime

# Supabase Connection Configuration
SUPABASE_URL = "ugmyyphiqoahludwuzpu.supabase.co"
SUPABASE_PORT = "5432"
SUPABASE_DB = "postgres"
SUPABASE_USER = os.getenv('SUPABASE_USER', 'postgres')
SUPABASE_PASSWORD = os.getenv('SUPABASE_PASSWORD', '')

def get_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(
            host=SUPABASE_URL,
            port=SUPABASE_PORT,
            database=SUPABASE_DB,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD,
            cursor_factory=RealDictCursor
        )
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None

def execute_sql_file():
    """Execute the complete schema SQL file"""
    try:
        print("📋 Reading schema file...")
        with open('supabase_schema.sql', 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        conn = get_connection()
        if not conn:
            return False
        
        print("🏗️ Creating database schema...")
        with conn.cursor() as cursor:
            cursor.execute(sql_content)
            conn.commit()
        
        conn.close()
        print("✅ Database schema created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Schema creation failed: {e}")
        return False

def create_admin_user():
    """Create admin user for testing"""
    try:
        conn = get_connection()
        if not conn:
            return False
        
        print("👤 Creating admin user...")
        
        # Get admin role ID
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM roles WHERE name = 'admin'")
            admin_role = cursor.fetchone()
            
            if not admin_role:
                print("❌ Admin role not found")
                return False
            
            # Hash password
            password = "admin123"
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            
            # Create admin user
            admin_id = str(uuid.uuid4())
            cursor.execute(
                """INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, email_verified)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (email) DO NOTHING""",
                (admin_id, 'admin@zamanyonet.com', hashed_password, 'System', 'Admin', 
                 admin_role['id'], True, True)
            )
            
            conn.commit()
        
        conn.close()
        print("✅ Admin user created: admin@zamanyonet.com / admin123")
        return True
        
    except Exception as e:
        print(f"❌ Admin user creation failed: {e}")
        return False

def create_sample_provider():
    """Create sample provider for testing"""
    try:
        conn = get_connection()
        if not conn:
            return False
        
        print("🏥 Creating sample provider...")
        
        with conn.cursor() as cursor:
            # Get provider role ID
            cursor.execute("SELECT id FROM roles WHERE name = 'provider'")
            provider_role = cursor.fetchone()
            
            if not provider_role:
                print("❌ Provider role not found")
                return False
            
            # Hash password
            password = "provider123"
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            
            # Create provider user
            provider_user_id = str(uuid.uuid4())
            cursor.execute(
                """INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, is_active, email_verified)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (email) DO NOTHING RETURNING id""",
                (provider_user_id, 'provider@zamanyonet.com', hashed_password, 'Dr. Ahmet', 'Yılmaz', 
                 '+90 555 123 4567', provider_role['id'], True, True)
            )
            
            # Create provider profile
            provider_id = str(uuid.uuid4())
            cursor.execute(
                """INSERT INTO providers (id, user_id, business_name, specialization, experience_years, city, address, bio)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT DO NOTHING""",
                (provider_id, provider_user_id, 'Dr. Ahmet Yılmaz Kliniği', 'Genel Pratisyen', 
                 10, 'İstanbul', 'Levent Mahallesi, İstanbul', 'Deneyimli genel pratisyen doktor')
            )
            
            conn.commit()
        
        conn.close()
        print("✅ Sample provider created: provider@zamanyonet.com / provider123")
        return True
        
    except Exception as e:
        print(f"❌ Sample provider creation failed: {e}")
        return False

def verify_setup():
    """Verify that everything is working"""
    try:
        conn = get_connection()
        if not conn:
            return False
        
        print("🔍 Verifying setup...")
        
        with conn.cursor() as cursor:
            # Check tables
            tables = [
                'roles', 'users', 'services', 'providers', 'appointments',
                'working_hours', 'shifts', 'system_logs', 'security_logs',
                'performance_logs', 'audit_logs'
            ]
            
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                result = cursor.fetchone()
                print(f"  📊 {table}: {result['count']} records")
        
        conn.close()
        print("✅ Setup verification complete!")
        return True
        
    except Exception as e:
        print(f"❌ Setup verification failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 ZamanYönet Supabase Setup Starting...")
    print("=" * 50)
    
    # Check if password is provided
    if not SUPABASE_PASSWORD:
        print("❌ SUPABASE_PASSWORD environment variable not set!")
        print("   Set it with: export SUPABASE_PASSWORD='your_password'")
        sys.exit(1)
    
    # Test connection
    print("🔌 Testing connection...")
    conn = get_connection()
    if not conn:
        print("❌ Cannot connect to Supabase!")
        sys.exit(1)
    
    conn.close()
    print("✅ Connection successful!")
    
    # Execute setup steps
    steps = [
        ("📋 Creating database schema", execute_sql_file),
        ("👤 Creating admin user", create_admin_user),
        ("🏥 Creating sample provider", create_sample_provider),
        ("🔍 Verifying setup", verify_setup)
    ]
    
    for step_name, step_func in steps:
        print(f"\n{step_name}...")
        if not step_func():
            print(f"❌ {step_name} failed!")
            sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 ZamanYönet Supabase Setup Complete!")
    print("\n📊 Test Accounts Created:")
    print("   👑 Admin: admin@zamanyonet.com / admin123")
    print("   🏥 Provider: provider@zamanyonet.com / provider123")
    print("\n🌐 Your API is ready at:")
    print("   Local: http://localhost:8000")
    print("   Production: https://your-app.onrender.com")
    print("\n🔗 Next Steps:")
    print("   1. Deploy to Render.com with app_supabase_production.py")
    print("   2. Set SUPABASE_PASSWORD environment variable")
    print("   3. Test API endpoints")
    print("   4. Update website with production URL")

if __name__ == "__main__":
    main() 