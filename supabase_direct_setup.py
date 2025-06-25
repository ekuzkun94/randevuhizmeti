#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🚀 Supabase Direct Setup Script
PostgreSQL bağımlılığı olmadan direkt Supabase'de tabloları oluşturur
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def setup_supabase_database():
    """Supabase'de tabloları direkt oluştur"""
    print("🚀 Supabase Database Setup Başlıyor...")
    print("=" * 50)
    
    # Database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL environment variable bulunamadı!")
        print("💡 Kullanım:")
        print("   DATABASE_URL='postgresql://postgres:PASSWORD@HOST:5432/postgres' python supabase_direct_setup.py")
        return False
    
    try:
        # Connect to Supabase
        print("🔌 Supabase'e bağlanıyor...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("✅ Supabase bağlantısı başarılı!")
        
        # Read SQL schema
        with open('supabase_schema.sql', 'r', encoding='utf-8') as f:
            sql_commands = f.read()
        
        print("📊 Database schema'sı oluşturuluyor...")
        
        # Execute SQL commands
        cursor.execute(sql_commands)
        conn.commit()
        
        print("✅ Tüm tablolar başarıyla oluşturuldu!")
        
        # Verify tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"\n📋 Oluşturulan tablolar ({len(tables)} adet):")
        for table in tables:
            print(f"   ✅ {table[0]}")
        
        # Test data insertion
        print("\n🧪 Test data ekleniyor...")
        
        # Check if admin role exists
        cursor.execute("SELECT id FROM roles WHERE name = 'admin'")
        admin_role = cursor.fetchone()
        
        if admin_role:
            print("✅ Default roles mevcut")
        
        # Check services
        cursor.execute("SELECT COUNT(*) FROM services")
        service_count = cursor.fetchone()[0]
        print(f"✅ {service_count} hizmet mevcut")
        
        conn.close()
        
        print("\n🎉 Supabase database setup tamamlandı!")
        print("🔗 API artık Supabase PostgreSQL kullanıyor")
        
        return True
        
    except Exception as e:
        print(f"❌ Hata oluştu: {e}")
        return False

def test_connection():
    """Database bağlantısını test et"""
    print("\n🧪 Database Bağlantı Testi...")
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL bulunamadı")
        return False
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Test queries
        tests = [
            ("Roles tablosu", "SELECT COUNT(*) as count FROM roles"),
            ("Services tablosu", "SELECT COUNT(*) as count FROM services"),
            ("Users tablosu", "SELECT COUNT(*) as count FROM users"),
            ("Appointments tablosu", "SELECT COUNT(*) as count FROM appointments"),
        ]
        
        for test_name, query in tests:
            cursor.execute(query)
            result = cursor.fetchone()
            print(f"   ✅ {test_name}: {result['count']} kayıt")
        
        conn.close()
        print("✅ Tüm tablolar erişilebilir!")
        return True
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return False

if __name__ == "__main__":
    print("🎯 ZamanYönet Supabase Database Setup")
    print("=" * 50)
    
    # Setup database
    success = setup_supabase_database()
    
    if success:
        # Test connection
        test_connection()
        
        print("\n🚀 Sonraki Adımlar:")
        print("1. Render deployment'ınızda DATABASE_URL'yi güncelleyin")
        print("2. Production app'ınızı restart edin")
        print("3. API'nizi test edin: python test_deployment.py")
        
    else:
        print("\n❌ Setup başarısız. DATABASE_URL'yi kontrol edin.")
        print("📝 Doğru format:")
        print("   postgresql://postgres:PASSWORD@HOST:5432/postgres") 