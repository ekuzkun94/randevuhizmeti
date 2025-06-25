#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Simple configuration for SQLite"""
    
    # Flask ayarları
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = True
    
    # SQLite Database
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'randevu.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT ayarları
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS ayarları
    CORS_ORIGINS = [
        'http://localhost:3000',  # Flutter web
        'http://127.0.0.1:3000',
        'http://localhost:5001',  # Flask API
        'http://127.0.0.1:5001'
    ]
    
    # Logging
    LOG_LEVEL = 'DEBUG'

class DevelopmentConfig(Config):
    """Development configuration"""
    pass

config = {
    'development': DevelopmentConfig,
    'default': DevelopmentConfig
} 