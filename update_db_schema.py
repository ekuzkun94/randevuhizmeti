#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def update_database_schema():
    """Veritabanı şemasını güncelleştir"""
    
    connection = pymysql.connect(
        host=os.getenv('MYSQL_HOST', 'localhost'),
        user=os.getenv('MYSQL_USER', 'root'),
        password=os.getenv('MYSQL_PASSWORD', ''),
        database='appointment_system',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    try:
        with connection.cursor() as cursor:
            print("Veritabanı şeması güncelleniyor...")
            
            # Önce roles tablosunu oluştur (foreign key hatası için)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS roles (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            
            # Default rolleri ekle (basit yaklaşım)
            roles_data = [
                ('1', 'Admin', 'Sistem yöneticisi'),
                ('2', 'Manager', 'Yönetici'),
                ('3', 'Provider', 'Hizmet sağlayıcı'),
                ('4', 'Customer', 'Müşteri')
            ]
            
            for role_data in roles_data:
                cursor.execute("""
                    INSERT IGNORE INTO roles (id, name, description)
                    VALUES (%s, %s, %s)
                """, role_data)
            
            print("✓ Roles tablosu hazırlandı")
            
            # Appointments tablosuna eksik kolonları ekle
            try:
                cursor.execute("ALTER TABLE appointments ADD COLUMN approval_level INT DEFAULT 0")
                print("✓ approval_level kolonu eklendi")
            except:
                print("- approval_level kolonu zaten var")
            
            try:
                cursor.execute("ALTER TABLE appointments ADD COLUMN approval_status VARCHAR(20) DEFAULT 'none'")
                print("✓ approval_status kolonu eklendi")
            except:
                print("- approval_status kolonu zaten var")
                
            try:
                cursor.execute("ALTER TABLE appointments ADD COLUMN approvers TEXT")
                print("✓ approvers kolonu eklendi")
            except:
                print("- approvers kolonu zaten var")
            
            # Approval tables oluştur
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS approvals (
                    id VARCHAR(36) PRIMARY KEY,
                    appointment_id VARCHAR(36) NOT NULL,
                    approval_level INT DEFAULT 1,
                    current_step INT DEFAULT 1,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_by VARCHAR(36) NOT NULL,
                    completed_at DATETIME NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            print("✓ Approvals tablosu oluşturuldu")
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS approval_steps (
                    id VARCHAR(36) PRIMARY KEY,
                    approval_id VARCHAR(36) NOT NULL,
                    step_number INT NOT NULL,
                    approver_id VARCHAR(36) NOT NULL,
                    approver_name VARCHAR(255),
                    status VARCHAR(20) DEFAULT 'pending',
                    approved_at DATETIME NULL,
                    comments TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            print("✓ Approval_steps tablosu oluşturuldu")
            
        connection.commit()
        print("\n🎉 Veritabanı şeması başarıyla güncellendi!")
        
    except Exception as e:
        print(f"Hata: {e}")
        connection.rollback()
    finally:
        connection.close()

if __name__ == "__main__":
    update_database_schema() 