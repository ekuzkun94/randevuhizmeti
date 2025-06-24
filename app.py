#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from flask import Flask, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, timezone

# Import our modules
from config import config
from models.models import db
from utils.logger import setup_logging
from utils.advanced_logger import advanced_logger
from ai_helper import AIHelper

# Routes
from routes.auth_routes import auth_bp
from routes.appointments import appointments_bp
from routes.services import services_bp
from routes.providers import providers_bp
from routes.admin_logs import admin_logs_bp

# Load environment variables
load_dotenv()

def create_app(config_name=None):
    """Application factory pattern"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Setup logging
    setup_logging(app.config)
    
    # Initialize extensions
    db.init_app(app)
    
    # Initialize advanced logger
    advanced_logger.init_app(app)
    
    # CORS setup
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # Initialize AI helper
    global ai_helper
    ai_helper = AIHelper()
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(appointments_bp)
    app.register_blueprint(services_bp)
    app.register_blueprint(providers_bp)
    app.register_blueprint(admin_logs_bp)
    
    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"⚠️ Database tables creation failed: {e}")
    
    # Admin dashboard route
    @app.route('/admin/dashboard')
    def admin_dashboard():
        return render_template('admin_log_dashboard.html')
    
    return app

# Create the application
app = create_app()

# Ana sayfa route'u
@app.route('/', methods=['GET'])
def home():
    """API ana sayfası ve endpoint listesi"""
    try:
        return {
            'status': 'success',
            'message': 'ZamanYönet Randevu API v2.0',
            'version': '2.0.0',
            'documentation': 'https://api.zamanyonet.com/docs',
            'endpoints': {
                'Authentication': {
                    'POST /auth/login': 'Kullanıcı girişi',
                    'POST /auth/register': 'Kullanıcı kaydı',
                    'POST /auth/forgot-password': 'Şifremi unuttum',
                    'POST /auth/reset-password': 'Şifre sıfırlama',
                    'POST /auth/refresh': 'Token yenileme',
                    'GET /auth/validate': 'Token doğrulama'
                },
                'Appointments': {
                    'GET /appointments': 'Randevu listesi',
                    'POST /appointments': 'Yeni randevu',
                    'GET /appointments/<id>': 'Randevu detayı',
                    'PUT /appointments/<id>': 'Randevu güncelle',
                    'DELETE /appointments/<id>': 'Randevu sil',
                    'GET /appointments/available-slots': 'Müsait saatler'
                },
                'Services': {
                    'GET /services': 'Hizmet listesi',
                    'POST /services': 'Yeni hizmet',
                    'GET /services/<id>': 'Hizmet detayı',
                    'PUT /services/<id>': 'Hizmet güncelle',
                    'DELETE /services/<id>': 'Hizmet sil',
                    'GET /services/categories': 'Kategoriler',
                    'GET /services/search': 'Hizmet arama'
                },
                'Providers': {
                    'GET /providers': 'Sağlayıcı listesi',
                    'GET /providers/<id>': 'Sağlayıcı detayı',
                    'PUT /providers/<id>': 'Sağlayıcı güncelle',
                    'GET /providers/<id>/working-hours': 'Çalışma saatleri',
                    'POST /providers/<id>/working-hours': 'Çalışma saati ekle',
                    'GET /providers/search': 'Sağlayıcı arama',
                    'GET /providers/cities': 'Şehirler',
                    'GET /providers/specializations': 'Uzmanlık alanları'
                }
            },
            'security': {
                'authentication': 'JWT Bearer Token',
                'rate_limiting': 'Enabled',
                'encryption': 'HTTPS Required',
                'password_hashing': 'bcrypt'
            },
            'features': {
                'role_based_access': 'Admin, Manager, Provider, Customer',
                'guest_bookings': 'Supported',
                'real_time_availability': 'Enabled',
                'ai_recommendations': 'Powered by AIHelper',
                'structured_logging': 'JSON format',
                'comprehensive_validation': 'All endpoints'
            }
        }
    except Exception as e:
        from utils.logger import app_logger
        app_logger.log_error('home_endpoint_error', str(e))
        return {
            'status': 'error', 
            'message': 'API geçici olarak kullanılamıyor'
        }, 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """API sağlık kontrolü"""
    try:
        # Database connection test
        db.session.execute(db.text('SELECT 1'))
        
        return {
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'database': 'connected',
            'version': '2.0.0',
            'uptime': 'OK',
            'services': {
                'authentication': 'operational',
                'appointments': 'operational',
                'services': 'operational', 
                'providers': 'operational',
                'ai_helper': 'operational'
            }
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'database': 'disconnected',
            'error': str(e),
            'version': '2.0.0'
        }, 503

# API statistics endpoint
@app.route('/stats', methods=['GET'])
def stats():
    """API istatistikleri"""
    try:
        from models.models import User, Provider, Service, Appointment
        
        stats_data = {
            'total_users': User.query.count(),
            'total_providers': Provider.query.filter_by(is_active=True).count(),
            'total_services': Service.query.filter_by(is_active=True).count(),
            'total_appointments': Appointment.query.count(),
            'active_appointments': Appointment.query.filter_by(status='confirmed').count(),
            'api_version': '2.0.0',
            'last_updated': datetime.now(timezone.utc).isoformat()
        }
        
        return stats_data
    except Exception as e:
        return {'error': 'İstatistikler yüklenemedi'}, 500

if __name__ == '__main__':
    print("🚨 RENDER.COM DEPLOYMENT İÇİN:")
    print("Start Command: gunicorn app_extreme_minimal:app")
    print("Bu app.py local development için, production için app_extreme_minimal.py kullanın!")
    print()
    print("🚀 ZamanYönet Randevu API v2.0 başlatılıyor...")
    print(f"🌍 Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"🔧 Debug mode: {app.config.get('DEBUG', False)}")
    print(f"📝 Logging level: {app.config.get('LOG_LEVEL', 'INFO')}")
    
    app.run(
        debug=app.config.get('DEBUG', False), 
        port=int(os.getenv('PORT', 5001)),
        host='0.0.0.0'
    ) 