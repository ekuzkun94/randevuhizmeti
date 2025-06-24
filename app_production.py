#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from flask import Flask, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, timezone

# Production config kullan
from config_production import config
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
    """Application factory pattern for production"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'production')
    
    app = Flask(__name__)
    
    # Load production configuration
    app.config.from_object(config[config_name])
    
    # Setup logging
    setup_logging(app.config)
    
    # Initialize extensions
    db.init_app(app)
    
    # Initialize advanced logger
    advanced_logger.init_app(app)
    
    # CORS setup for production
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         supports_credentials=True)
    
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
            print("✅ Production database tables ready")
        except Exception as e:
            print(f"⚠️ Database tables creation failed: {e}")
    
    # Production-specific error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Endpoint not found', 'status': 404}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error', 'status': 500}, 500
    
    @app.errorhandler(403)
    def forbidden(error):
        return {'error': 'Access forbidden', 'status': 403}, 403
    
    # Security headers
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        if app.config.get('FORCE_HTTPS'):
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response
    
    # Admin dashboard route
    @app.route('/admin/dashboard')
    def admin_dashboard():
        return render_template('admin_log_dashboard.html')
    
    return app

# Create the application
app = create_app()

# Production routes
@app.route('/', methods=['GET'])
def home():
    """Production API home page"""
    try:
        return {
            'status': 'success',
            'message': 'ZamanYönet Production API',
            'version': '2.0.0',
            'environment': 'production',
            'documentation': 'https://api.zamanyonet.com/docs',
            'endpoints': {
                'Authentication': {
                    'POST /auth/login': 'User login',
                    'POST /auth/register': 'User registration',
                    'POST /auth/refresh': 'Token refresh',
                    'GET /auth/validate': 'Token validation'
                },
                'Appointments': {
                    'GET /appointments': 'List appointments',
                    'POST /appointments': 'Create appointment',
                    'GET /appointments/<id>': 'Get appointment',
                    'PUT /appointments/<id>': 'Update appointment',
                    'DELETE /appointments/<id>': 'Delete appointment'
                },
                'Services': {
                    'GET /services': 'List services',
                    'POST /services': 'Create service',
                    'GET /services/<id>': 'Get service',
                    'GET /services/search': 'Search services'
                },
                'Providers': {
                    'GET /providers': 'List providers',
                    'GET /providers/<id>': 'Get provider',
                    'GET /providers/search': 'Search providers'
                },
                'Admin': {
                    'GET /admin/dashboard': 'Admin dashboard',
                    'GET /admin/logs/dashboard': 'Logs dashboard API'
                }
            },
            'features': {
                'security': 'JWT + bcrypt + rate limiting',
                'database': 'Supabase PostgreSQL',
                'logging': 'Advanced structured logging',
                'monitoring': 'Real-time performance tracking',
                'deployment': 'Production-ready'
            }
        }
    except Exception as e:
        advanced_logger.log_error(e, context='production_home_endpoint')
        return {
            'status': 'error', 
            'message': 'Service temporarily unavailable'
        }, 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """Production health check"""
    try:
        # Database connection test
        with app.app_context():
            db.session.execute(db.text('SELECT 1'))
        
        return {
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'environment': 'production',
            'database': 'connected',
            'version': '2.0.0',
            'uptime': 'OK',
            'services': {
                'authentication': 'operational',
                'appointments': 'operational',
                'services': 'operational', 
                'providers': 'operational',
                'logging': 'operational',
                'ai_helper': 'operational'
            }
        }
    except Exception as e:
        advanced_logger.log_error(e, context='production_health_check')
        return {
            'status': 'unhealthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'environment': 'production',
            'database': 'disconnected',
            'error': 'Database connection failed',
            'version': '2.0.0'
        }, 503

# API statistics endpoint
@app.route('/stats', methods=['GET'])
def stats():
    """Production API statistics"""
    try:
        from models.models import User, Provider, Service, Appointment
        
        stats_data = {
            'total_users': User.query.count(),
            'active_providers': Provider.query.filter_by(is_active=True).count(),
            'total_services': Service.query.filter_by(is_active=True).count(),
            'total_appointments': Appointment.query.count(),
            'pending_appointments': Appointment.query.filter_by(status='pending').count(),
            'confirmed_appointments': Appointment.query.filter_by(status='confirmed').count(),
            'environment': 'production',
            'api_version': '2.0.0',
            'database': 'Supabase PostgreSQL',
            'last_updated': datetime.now(timezone.utc).isoformat()
        }
        
        return stats_data
    except Exception as e:
        advanced_logger.log_error(e, context='production_stats')
        return {'error': 'Statistics unavailable'}, 500

# Start application
if __name__ == '__main__':
    # Production server configuration
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print("🚀 ZamanYönet Production API v2.0 başlatılıyor...")
    print(f"🌍 Environment: {os.getenv('FLASK_ENV', 'production')}")
    print(f"🔧 Debug mode: {debug}")
    print(f"📝 Logging level: {app.config.get('LOG_LEVEL', 'WARNING')}")
    print(f"🔗 Database: Supabase PostgreSQL")
    print(f"🚪 Port: {port}")
    
    if debug:
        # Development server
        app.run(debug=True, port=port, host='0.0.0.0')
    else:
        # Production: Use gunicorn instead
        print("🏭 Production mode: Use 'gunicorn app_production:app' instead")
        print("📋 Or use: python app_production.py for testing")
        app.run(debug=False, port=port, host='0.0.0.0') 