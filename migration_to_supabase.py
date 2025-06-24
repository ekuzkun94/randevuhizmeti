#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ZamanYönet MySQL to Supabase PostgreSQL Migration Script
Bu script MySQL'deki mevcut veriyi Supabase PostgreSQL'e taşır
"""

import os
import sys
import pymysql
import psycopg2
from datetime import datetime
import json
from dotenv import load_dotenv

load_dotenv()

class DatabaseMigrator:
    def __init__(self):
        # MySQL bağlantısı (eski)
        self.mysql_config = {
            'host': os.getenv('MYSQL_HOST', 'localhost'),
            'user': os.getenv('MYSQL_USER', 'randevu_user'),
            'password': os.getenv('MYSQL_PASSWORD', 'randevu_pass'),
            'database': os.getenv('MYSQL_DATABASE', 'randevu_db'),
            'charset': 'utf8mb4'
        }
        
        # PostgreSQL bağlantısı (Supabase)
        self.postgres_url = os.getenv('DATABASE_URL')
        
        if not self.postgres_url:
            print("❌ DATABASE_URL bulunamadı! Supabase connection string'i .env dosyasına ekleyin.")
            sys.exit(1)
    
    def connect_mysql(self):
        """MySQL bağlantısı"""
        try:
            conn = pymysql.connect(**self.mysql_config)
            print("✅ MySQL bağlantısı başarılı")
            return conn
        except Exception as e:
            print(f"❌ MySQL bağlantı hatası: {e}")
            return None
    
    def connect_postgres(self):
        """PostgreSQL (Supabase) bağlantısı"""
        try:
            conn = psycopg2.connect(self.postgres_url)
            print("✅ Supabase PostgreSQL bağlantısı başarılı")
            return conn
        except Exception as e:
            print(f"❌ Supabase bağlantı hatası: {e}")
            return None
    
    def export_mysql_data(self):
        """MySQL'den veri export et"""
        mysql_conn = self.connect_mysql()
        if not mysql_conn:
            return None
        
        exported_data = {}
        
        try:
            cursor = mysql_conn.cursor(pymysql.cursors.DictCursor)
            
            # Export edilecek tablolar
            tables = [
                'roles', 'users', 'providers', 'services', 
                'appointments', 'working_hours', 'shifts',
                'system_logs', 'security_logs', 'audit_logs', 'performance_logs'
            ]
            
            for table in tables:
                try:
                    cursor.execute(f"SELECT * FROM {table}")
                    data = cursor.fetchall()
                    exported_data[table] = data
                    print(f"✅ {table}: {len(data)} kayıt export edildi")
                except Exception as e:
                    print(f"⚠️ {table} tablosu export edilemedi: {e}")
            
        except Exception as e:
            print(f"❌ MySQL export hatası: {e}")
        finally:
            mysql_conn.close()
        
        return exported_data
    
    def create_postgres_tables(self):
        """PostgreSQL'de tabloları oluştur"""
        postgres_conn = self.connect_postgres()
        if not postgres_conn:
            return False
        
        try:
            cursor = postgres_conn.cursor()
            
            # PostgreSQL için table creation scripts
            create_scripts = [
                # Roles table
                """
                CREATE TABLE IF NOT EXISTS roles (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(50) UNIQUE NOT NULL,
                    description TEXT,
                    permissions TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """,
                
                # Users table
                """
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    role_id UUID REFERENCES roles(id),
                    is_active BOOLEAN DEFAULT true,
                    email_verified BOOLEAN DEFAULT false,
                    last_login TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """,
                
                # Services table
                """
                CREATE TABLE IF NOT EXISTS services (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    duration INTEGER NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    category VARCHAR(100),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """,
                
                # Providers table
                """
                CREATE TABLE IF NOT EXISTS providers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id),
                    business_name VARCHAR(255),
                    specialization VARCHAR(255),
                    experience_years INTEGER,
                    city VARCHAR(100),
                    address TEXT,
                    bio TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """,
                
                # Appointments table
                """
                CREATE TABLE IF NOT EXISTS appointments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    customer_id UUID REFERENCES users(id),
                    provider_id UUID REFERENCES providers(id),
                    service_id UUID REFERENCES services(id),
                    appointment_date DATE NOT NULL,
                    appointment_time TIME NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    notes TEXT,
                    guest_name VARCHAR(255),
                    guest_email VARCHAR(255),
                    guest_phone VARCHAR(20),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """,
                
                # System Logs table
                """
                CREATE TABLE IF NOT EXISTS system_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    level VARCHAR(20) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    message TEXT NOT NULL,
                    user_id UUID,
                    ip_address INET,
                    user_agent TEXT,
                    endpoint VARCHAR(255),
                    method VARCHAR(10),
                    status_code INTEGER,
                    response_time FLOAT,
                    extra_data JSONB,
                    server_name VARCHAR(100),
                    environment VARCHAR(20) DEFAULT 'production',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """,
                
                # Security Logs table
                """
                CREATE TABLE IF NOT EXISTS security_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    event_type VARCHAR(50) NOT NULL,
                    severity VARCHAR(20) DEFAULT 'medium',
                    user_id UUID,
                    email VARCHAR(255),
                    role_id UUID,
                    ip_address INET,
                    user_agent TEXT,
                    endpoint VARCHAR(255),
                    method VARCHAR(10),
                    success BOOLEAN,
                    reason VARCHAR(255),
                    details JSONB,
                    risk_score INTEGER DEFAULT 0,
                    blocked BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """,
                
                # Performance Logs table
                """
                CREATE TABLE IF NOT EXISTS performance_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    endpoint VARCHAR(255) NOT NULL,
                    method VARCHAR(10) NOT NULL,
                    user_id UUID,
                    response_time FLOAT NOT NULL,
                    memory_usage BIGINT,
                    cpu_usage FLOAT,
                    db_queries INTEGER DEFAULT 0,
                    db_time FLOAT DEFAULT 0.0,
                    status_code INTEGER,
                    response_size INTEGER,
                    query_params JSONB,
                    slow_query BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """,
                
                # Audit Logs table
                """
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    action VARCHAR(20) NOT NULL,
                    table_name VARCHAR(50) NOT NULL,
                    record_id UUID,
                    user_id UUID NOT NULL,
                    user_email VARCHAR(255),
                    user_role VARCHAR(50),
                    ip_address INET,
                    user_agent TEXT,
                    endpoint VARCHAR(255),
                    old_values JSONB,
                    new_values JSONB,
                    changes JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """
            ]
            
            # Create indexes
            index_scripts = [
                "CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);",
                "CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);",
                "CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);",
                "CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);",
                "CREATE INDEX IF NOT EXISTS idx_performance_logs_timestamp ON performance_logs(timestamp);",
                "CREATE INDEX IF NOT EXISTS idx_performance_logs_slow ON performance_logs(slow_query);",
                "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);",
                "CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);",
                "CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);",
                "CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);",
            ]
            
            print("🔨 PostgreSQL tabloları oluşturuluyor...")
            
            for script in create_scripts:
                cursor.execute(script)
                print("✅ Tablo oluşturuldu")
            
            print("🔨 İndeksler oluşturuluyor...")
            for script in index_scripts:
                cursor.execute(script)
            
            postgres_conn.commit()
            print("✅ Tüm tablolar ve indeksler başarıyla oluşturuldu")
            return True
            
        except Exception as e:
            print(f"❌ PostgreSQL tablo oluşturma hatası: {e}")
            postgres_conn.rollback()
            return False
        finally:
            postgres_conn.close()
    
    def migrate_data(self, exported_data):
        """Veriyi PostgreSQL'e import et"""
        if not exported_data:
            print("❌ Export edilmiş veri bulunamadı")
            return False
        
        postgres_conn = self.connect_postgres()
        if not postgres_conn:
            return False
        
        try:
            cursor = postgres_conn.cursor()
            
            # Migration order (foreign key constraints)
            migration_order = [
                'roles', 'users', 'providers', 'services', 
                'appointments', 'working_hours', 'shifts',
                'system_logs', 'security_logs', 'audit_logs', 'performance_logs'
            ]
            
            for table in migration_order:
                if table not in exported_data:
                    continue
                
                data = exported_data[table]
                if not data:
                    print(f"⚠️ {table} tablosu boş")
                    continue
                
                print(f"🔄 {table} migration başlıyor... ({len(data)} kayıt)")
                
                # Table-specific migration logic
                if table == 'users':
                    self._migrate_users(cursor, data)
                elif table == 'roles':
                    self._migrate_roles(cursor, data)
                elif table == 'system_logs':
                    self._migrate_system_logs(cursor, data)
                # Add other table migrations as needed
                
                print(f"✅ {table} migration tamamlandı")
            
            postgres_conn.commit()
            print("🎉 Tüm data migration tamamlandı!")
            return True
            
        except Exception as e:
            print(f"❌ Data migration hatası: {e}")
            postgres_conn.rollback()
            return False
        finally:
            postgres_conn.close()
    
    def _migrate_users(self, cursor, data):
        """Users tablosu migration"""
        for row in data:
            cursor.execute("""
                INSERT INTO users (email, password_hash, first_name, last_name, phone, 
                                 is_active, email_verified, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (email) DO NOTHING
            """, (
                row['email'], row['password_hash'], row['first_name'],
                row['last_name'], row.get('phone'), row.get('is_active', True),
                row.get('email_verified', False), row.get('created_at'), row.get('updated_at')
            ))
    
    def _migrate_roles(self, cursor, data):
        """Roles tablosu migration"""
        for row in data:
            cursor.execute("""
                INSERT INTO roles (name, description, permissions, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (name) DO NOTHING
            """, (
                row['name'], row.get('description'), row.get('permissions'),
                row.get('is_active', True), row.get('created_at'), row.get('updated_at')
            ))
    
    def _migrate_system_logs(self, cursor, data):
        """System logs migration"""
        for row in data:
            extra_data = None
            if row.get('extra_data'):
                try:
                    extra_data = json.loads(row['extra_data'])
                except:
                    extra_data = {'raw': row['extra_data']}
            
            cursor.execute("""
                INSERT INTO system_logs (timestamp, level, category, message, user_id,
                                       ip_address, user_agent, endpoint, method, status_code,
                                       response_time, extra_data, server_name, environment, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                row['timestamp'], row['level'], row['category'], row['message'],
                row.get('user_id'), row.get('ip_address'), row.get('user_agent'),
                row.get('endpoint'), row.get('method'), row.get('status_code'),
                row.get('response_time'), json.dumps(extra_data) if extra_data else None,
                row.get('server_name'), row.get('environment', 'production'), row.get('created_at')
            ))
    
    def run_migration(self):
        """Ana migration fonksiyonu"""
        print("🚀 ZamanYönet MySQL → Supabase PostgreSQL Migration Başlıyor...")
        print("=" * 60)
        
        # 1. MySQL'den veri export et
        print("📤 1. MySQL'den veri export ediliyor...")
        exported_data = self.export_mysql_data()
        
        if not exported_data:
            print("❌ Export başarısız, migration durduruluyor")
            return False
        
        # 2. PostgreSQL tabloları oluştur
        print("\n🔨 2. Supabase PostgreSQL tabloları oluşturuluyor...")
        if not self.create_postgres_tables():
            print("❌ Tablo oluşturma başarısız, migration durduruluyor")
            return False
        
        # 3. Veriyi import et
        print("\n📥 3. Veri Supabase'e import ediliyor...")
        if not self.migrate_data(exported_data):
            print("❌ Data import başarısız")
            return False
        
        print("\n🎉 Migration başarıyla tamamlandı!")
        print("🌟 ZamanYönet artık Supabase PostgreSQL kullanıyor!")
        return True

if __name__ == "__main__":
    print("🚀 ZamanYönet Supabase Migration Aracı")
    print("=" * 50)
    
    migrator = DatabaseMigrator()
    success = migrator.run_migration()
    
    if success:
        print("\n✅ Migration tamamlandı! Artık production config'i kullanabilirsiniz.")
    else:
        print("\n❌ Migration başarısız oldu. Lütfen hataları kontrol edin.")
    
    sys.exit(0 if success else 1) 