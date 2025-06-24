#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask ayarları
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-super-secret-key-change-this')
    DEBUG = False  # Production'da False
    
    # Supabase PostgreSQL Database
    SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ugmyyphiqoahludwuzpu.supabase.co')
    SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI')
    
    # Database Connection (PostgreSQL)
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:[YOUR-PASSWORD]@db.ugmyyphiqoahludwuzpu.supabase.co:5432/postgres')  # Supabase connection string
    
    if DATABASE_URL:
        # For pg8000 driver compatibility (pure Python PostgreSQL driver)
        if DATABASE_URL.startswith('postgresql://'):
            SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace('postgresql://', 'postgresql+pg8000://')
        else:
            SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        # Fallback to individual components
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_PORT = os.getenv('DB_PORT', '5432')
        DB_USER = os.getenv('DB_USER', 'postgres')
        DB_PASSWORD = os.getenv('DB_PASSWORD', '')
        DB_NAME = os.getenv('DB_NAME', 'randevu_db')
        
        SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,  # 1 hour
        'pool_timeout': 30,
        'max_overflow': 10,
        'pool_size': 20
    }
    
    # JWT ayarları
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)  # Production'da daha uzun
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS ayarları (Production domains)
    CORS_ORIGINS = [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        'https://app.yourdomain.com',
        # Development fallbacks
        'http://localhost:3000',
        'http://localhost:8080'
    ]
    
    # Rate limiting (Production values)
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', "memory://")
    RATELIMIT_DEFAULT = "1000 per hour"  # Daha yüksek limit
    
    # Email ayarları
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')
    
    # File upload ayarları
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32MB production
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    
    # Logging ayarları (Production)
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'WARNING')
    LOG_FILE = os.getenv('LOG_FILE', 'production.log')
    
    # Security ayarları (Production)
    BCRYPT_LOG_ROUNDS = 14  # Daha güvenli
    WTF_CSRF_ENABLED = True
    SESSION_COOKIE_SECURE = True  # HTTPS required
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'  # Stricter for production
    
    # Production specific
    PREFERRED_URL_SCHEME = 'https'
    FORCE_HTTPS = True

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SESSION_COOKIE_SECURE = False
    FORCE_HTTPS = False
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080'
    ]
    
class ProductionConfig(Config):
    """Production configuration"""
    pass

class StagingConfig(Config):
    """Staging configuration"""
    DEBUG = False
    LOG_LEVEL = 'INFO'

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'staging': StagingConfig,
    'default': ProductionConfig  # Production default
} 