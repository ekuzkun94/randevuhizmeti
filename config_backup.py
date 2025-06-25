#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration class - SQLite for development"""
    
    # Flask ayarları
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # SQLite Database ayarları (Development)
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    if DATABASE_URL and DATABASE_URL.startswith('postgresql'):
        # PostgreSQL for production (Supabase)
        if DATABASE_URL.startswith('postgresql://'):
            SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace('postgresql://', 'postgresql+pg8000://')
        else:
            SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        # SQLite for development
        BASE_DIR = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'randevu.db')}"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # SQLite vs PostgreSQL için farklı engine options
    if 'sqlite' in SQLALCHEMY_DATABASE_URI:
        # SQLite için basit ayarlar
        SQLALCHEMY_ENGINE_OPTIONS = {
            'echo': DEBUG  # SQL queries'leri debug için göster
        }
    else:
        # PostgreSQL için pool ayarları
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_pre_ping': True,
            'pool_recycle': 3600,
            'pool_timeout': 30,
            'max_overflow': 10,
            'pool_size': 5
        }
    
    # Supabase Configuration (for production)
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    # JWT ayarları
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS ayarları (Flutter compatibility)
    CORS_ORIGINS = [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3000',  # Flutter web
        'http://127.0.0.1:3000',
        'http://localhost:5173',  # Vite
        'http://localhost:5001',  # Flask API
        'http://127.0.0.1:5001'
    ]
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = "memory://"
    RATELIMIT_DEFAULT = "100 per hour"
    
    # Email ayarları
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')
    
    # File upload ayarları
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    
    # Logging ayarları
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'app.log')
    
    # Security ayarları
    BCRYPT_LOG_ROUNDS = 12
    WTF_CSRF_ENABLED = True
    SESSION_COOKIE_SECURE = not DEBUG
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

class DevelopmentConfig(Config):
    """Development configuration - SQLite optimized"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    
    # SQLite için basit ayarlar - parent'daki pool ayarlarını override et
    SQLALCHEMY_ENGINE_OPTIONS = {'echo': True}
    
    # Development için ek ayarlar
    FLASK_ENV = 'development'
    TEMPLATES_AUTO_RELOAD = True
    EXPLAIN_TEMPLATE_LOADING = False
    
class ProductionConfig(Config):
    """Production configuration - Supabase PostgreSQL"""
    DEBUG = False
    SESSION_COOKIE_SECURE = True
    LOG_LEVEL = 'WARNING'
    
    # Production optimized pool settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,  # 1 hour
        'pool_timeout': 30,
        'max_overflow': 20,
        'pool_size': 10  # Larger pool for production
    }
    
class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # Fast in-memory for tests
    WTF_CSRF_ENABLED = False

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig  # Default to development for local testing
} 