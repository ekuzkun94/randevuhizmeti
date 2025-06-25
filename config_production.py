#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import secrets
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
    """Production configuration for Render.com deployment with Supabase PostgreSQL"""
    
    # Flask Settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-production-key-change-this!')
    DEBUG = False
    TESTING = False
    ENV = 'production'
    
    # Database Configuration (PostgreSQL/Supabase)
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL:
        # Handle both postgres:// and postgresql:// URLs
        if DATABASE_URL.startswith('postgres://'):
            DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql+pg8000://', 1)
        elif not DATABASE_URL.startswith('postgresql+pg8000://'):
            DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+pg8000://', 1)
    else:
        # Fallback Supabase connection
        SUPABASE_URL = 'https://ugmyyphiqoahludwuzpu.supabase.co'
        SUPABASE_PASSWORD = os.environ.get('SUPABASE_PASSWORD', '*RasT_1385*!')
        DATABASE_URL = f"postgresql+pg8000://postgres.ugmyyphiqoahludwuzpu:{SUPABASE_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_timeout': 20,
        'pool_recycle': 300,
        'pool_pre_ping': True,
        'pool_size': 10,
        'max_overflow': 20
    }
    
    # Security Settings (Simplified for deployment)
    # Use basic security instead of bcrypt for initial deployment
    USE_BCRYPT = False  # Disable bcrypt to avoid compilation issues
    PASSWORD_MIN_LENGTH = 6
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-production-key-change-this!')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ALGORITHM = 'HS256'
    
    # Session Configuration
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour
    
    # CORS Settings
    CORS_ORIGINS = [
        'https://zamanyonet.com',
        'https://www.zamanyonet.com',
        'https://app.zamanyonet.com'
    ]
    
    # Rate Limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = "memory://"  # Use memory for now, Redis later
    RATELIMIT_STRATEGY = "fixed-window"
    RATELIMIT_HEADERS_ENABLED = True
    
    # Email Configuration (Optional)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@zamanyonet.com')
    
    # Logging Configuration
    LOGGING_LEVEL = 'INFO'
    LOG_FILE = '/var/log/zamanyonet/app.log'
    
    # File Upload Settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = '/tmp/uploads'  # Temporary storage on Render
    
    # Supabase Settings
    SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc'
    SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI'
    
    # Performance Settings
    SQLALCHEMY_ENGINE_OPTIONS.update({
        'connect_args': {
            'application_name': 'ZamanYonet_API',
            'options': '-c statement_timeout=30000'  # 30 second timeout
        }
    })
    
    # Security Headers
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    }
    
    # Feature Flags
    ENABLE_REGISTRATION = True
    ENABLE_PASSWORD_RESET = True
    ENABLE_ANALYTICS = True
    ENABLE_MONITORING = True
    
    @staticmethod
    def init_app(app):
        """Initialize production-specific settings"""
        # Simplified password hashing for deployment
        app.config['PASSWORD_HASH_METHOD'] = 'simple'  # Will upgrade to bcrypt later
        
        # Configure logging
        import logging
        logging.basicConfig(
            level=getattr(logging, app.config['LOGGING_LEVEL']),
            format='%(asctime)s %(levelname)s: %(message)s'
        )

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