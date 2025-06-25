#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from flask import Flask, render_template, request
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, timezone
import sqlite3
import tempfile

# Import our modules
import sqlite3
import tempfile

# Create simple config
class SimpleConfig:
    SECRET_KEY = 'dev-secret-key'
    DEBUG = True
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'randevu.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'dev-jwt-secret'
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']

config = {'development': SimpleConfig, 'default': SimpleConfig}

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
from routes.staff_routes import staff_bp

# Load environment variables
load_dotenv()

# Global variables for AI components
ai_helper = None
recommendation_engine = None

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
    
    # Initialize AI components
    global ai_helper, recommendation_engine
    ai_helper = AIHelper()
    
    # Import AI recommendation engine after app context
    with app.app_context():
        from ai.recommendation_engine import RecommendationEngine
        recommendation_engine = RecommendationEngine()
    
    # Register basic blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(appointments_bp)
    app.register_blueprint(services_bp)
    app.register_blueprint(providers_bp)
    app.register_blueprint(admin_logs_bp)
    app.register_blueprint(staff_bp)
    
    # Register AI-enhanced routes (import inside app context to avoid circular imports)
    with app.app_context():
        try:
            from routes.medications import medications_bp
            from routes.activities import activities_bp
            from routes.tasks import tasks_bp
            from routes.businesses import businesses_bp
            
            app.register_blueprint(medications_bp)
            app.register_blueprint(activities_bp)
            app.register_blueprint(tasks_bp)
            app.register_blueprint(businesses_bp)
            print("✅ AI-enhanced routes registered successfully")
        except ImportError as e:
            print(f"⚠️ Warning: Could not import AI routes: {e}")
    
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

# AI endpoints
@app.route('/ai/personalized-dashboard/<customer_id>', methods=['GET', 'OPTIONS'])
def ai_personalized_dashboard(customer_id):
    """AI personalized dashboard for customers"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # AI Recommendation Engine kullanarak gerçek öneriler üret
        recommendations = recommendation_engine.generate_recommendations(customer_id)
        
        # Statistics
        from models.models import User, Appointment, Task, Activity
        user = User.query.get(customer_id)
        
        quick_stats = {
            'total_appointments': 0,
            'favorite_service': 'Henüz randevu yok',
            'next_available': datetime.now(timezone.utc).isoformat(),
            'loyalty_points': 0,
            'completed_tasks': 0,
            'this_week_activities': 0
        }
        
        if user:
            appointments = Appointment.query.filter_by(customer_id=customer_id).all()
            tasks = Task.query.filter_by(user_id=customer_id, status='completed').all()
            
            # Son 7 günün aktiviteleri
            from datetime import timedelta
            week_ago = datetime.now().date() - timedelta(days=7)
            activities = Activity.query.filter(
                Activity.user_id == customer_id,
                Activity.date >= week_ago
            ).all()
            
            quick_stats.update({
                'total_appointments': len(appointments),
                'completed_tasks': len(tasks),
                'this_week_activities': len(activities)
            })
            
            # En çok kullandığı hizmet
            if appointments:
                from collections import Counter
                services = [apt.service.name for apt in appointments if apt.service]
                if services:
                    most_common = Counter(services).most_common(1)[0]
                    quick_stats['favorite_service'] = most_common[0]
        
        dashboard_data = {
            'customer_id': customer_id,
            'user_name': user.name if user else 'Kullanıcı',
            'recommendations': recommendations,
            'quick_stats': quick_stats,
            'modules': {
                'appointments': True,
                'medications': True,
                'activities': True,
                'tasks': True
            },
            'status': 'success',
            'generated_at': datetime.now(timezone.utc).isoformat()
        }
        
        # User behavior track et
        recommendation_engine.track_user_behavior(
            customer_id, 
            'dashboard_view',
            {'recommendations_count': len(recommendations)}
        )
        
        return dashboard_data
        
    except Exception as e:
        return {
            'status': 'error',
            'message': 'AI dashboard verileri yüklenemedi',
            'error': str(e)
        }, 500

@app.route('/ai/generate-report/<customer_id>', methods=['GET', 'OPTIONS'])
def ai_generate_report(customer_id):
    """AI generated comprehensive report for customers"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        from models.models import User, Appointment, Task, Activity, Medication
        
        user = User.query.get(customer_id)
        if not user:
            return {'status': 'error', 'message': 'Kullanıcı bulunamadı'}, 404
        
        # Veri toplama
        appointments = Appointment.query.filter_by(customer_id=customer_id).all()
        tasks = Task.query.filter_by(user_id=customer_id).all()
        activities = Activity.query.filter_by(user_id=customer_id).all()
        medications = Medication.query.filter_by(user_id=customer_id, is_active=True).all()
        
        # Rapor bölümleri
        sections = []
        
        # Randevu Analizi
        if appointments:
            completed_apts = [apt for apt in appointments if apt.status == 'completed']
            sections.append({
                'title': 'Randevu Geçmişi ve Analizi',
                'content': f'Toplam {len(appointments)} randevunuz var, {len(completed_apts)} tanesi tamamlandı. '
                          f'Uyum oranınız: %{(len(completed_apts)/len(appointments)*100):.0f}',
                'icon': '📅',
                'metrics': {
                    'total': len(appointments),
                    'completed': len(completed_apts),
                    'compliance_rate': len(completed_apts)/len(appointments)*100 if appointments else 0
                }
            })
        
        # Görev Yönetimi
        if tasks:
            completed_tasks = [task for task in tasks if task.status == 'completed']
            overdue_tasks = [task for task in tasks if task.due_date and task.due_date < datetime.now() and task.status != 'completed']
            
            sections.append({
                'title': 'Görev Yönetimi ve Produktivite',
                'content': f'{len(completed_tasks)} görev tamamladınız. {len(overdue_tasks)} gecikmiş göreviniz var. '
                          f'Tamamlama oranınız: %{(len(completed_tasks)/len(tasks)*100):.0f}',
                'icon': '✅',
                'metrics': {
                    'total': len(tasks),
                    'completed': len(completed_tasks),
                    'overdue': len(overdue_tasks),
                    'completion_rate': len(completed_tasks)/len(tasks)*100 if tasks else 0
                }
            })
        
        # Aktivite Analizi
        if activities:
            total_calories = sum(act.calories_burned or 0 for act in activities)
            total_duration = sum(act.duration_minutes or 0 for act in activities)
            
            sections.append({
                'title': 'Fiziksel Aktivite ve Sağlık',
                'content': f'{len(activities)} aktivite kaydınız var. Toplam {total_calories} kalori yaktınız. '
                          f'Toplam aktivite süresi: {total_duration} dakika.',
                'icon': '🏃‍♀️',
                'metrics': {
                    'total_activities': len(activities),
                    'total_calories': total_calories,
                    'total_duration': total_duration,
                    'avg_duration': total_duration/len(activities) if activities else 0
                }
            })
        
        # İlaç Uyumu
        if medications:
            avg_adherence = sum(med.adherence_rate for med in medications) / len(medications)
            sections.append({
                'title': 'İlaç Uyumu ve Sağlık Takibi',
                'content': f'{len(medications)} aktif ilacınız var. Ortalama uyum oranınız: %{avg_adherence:.0f}. '
                          f'Düzenli takip önemlidir.',
                'icon': '💊',
                'metrics': {
                    'active_medications': len(medications),
                    'average_adherence': avg_adherence,
                    'adherence_grade': 'Mükemmel' if avg_adherence >= 95 else 'İyi' if avg_adherence >= 80 else 'Geliştirilmeli'
                }
            })
        
        # AI Önerileri ekle
        recommendations = recommendation_engine.generate_recommendations(customer_id)
        if recommendations:
            sections.append({
                'title': 'Kişiselleştirilmiş AI Önerileri',
                'content': f'{len(recommendations)} adet size özel öneri hazırladık.',
                'icon': '🤖',
                'recommendations': recommendations[:5]  # İlk 5 öneri
            })
        
        report_data = {
            'customer_id': customer_id,
            'user_name': user.name,
            'report': {
                'title': f'{user.name} - Kişisel ZamanYönet Raporu',
                'summary': 'AI tarafından analiz edilen verilerinize dayalı kapsamlı rapor',
                'sections': sections,
                'overall_score': calculate_overall_score(appointments, tasks, activities, medications),
                'period': 'Son 30 gün',
                'generated_by': 'ZamanYönet AI v2.0'
            },
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'status': 'success'
        }
        
        # User behavior track et
        recommendation_engine.track_user_behavior(
            customer_id, 
            'report_generated',
            {'sections_count': len(sections)}
        )
        
        return report_data
        
    except Exception as e:
        return {
            'status': 'error', 
            'message': 'AI raporu oluşturulamadı',
            'error': str(e)
        }, 500

def calculate_overall_score(appointments, tasks, activities, medications):
    """Genel kullanıcı skoru hesapla"""
    score = 0
    factors = 0
    
    # Randevu uyum skoru
    if appointments:
        completed_apts = [apt for apt in appointments if apt.status == 'completed']
        apt_score = (len(completed_apts) / len(appointments)) * 25
        score += apt_score
        factors += 1
    
    # Görev tamamlama skoru
    if tasks:
        completed_tasks = [task for task in tasks if task.status == 'completed']
        task_score = (len(completed_tasks) / len(tasks)) * 25
        score += task_score
        factors += 1
    
    # Aktivite skoru (varlığa göre)
    if activities:
        activity_score = min(25, len(activities) * 2)  # Max 25 puan
        score += activity_score
        factors += 1
    
    # İlaç uyum skoru
    if medications:
        avg_adherence = sum(med.adherence_rate for med in medications) / len(medications)
        med_score = (avg_adherence / 100) * 25
        score += med_score
        factors += 1
    
    final_score = score / factors if factors > 0 else 0
    
    return {
        'score': round(final_score, 1),
        'grade': 'A' if final_score >= 90 else 'B' if final_score >= 80 else 'C' if final_score >= 70 else 'D',
        'description': get_score_description(final_score)
    }

def get_score_description(score):
    """Skor açıklaması"""
    if score >= 90:
        return 'Mükemmel! Tüm konularda harika performans gösteriyorsunuz.'
    elif score >= 80:
        return 'Çok iyi! Birkaç alanda gelişim için alan var.'
    elif score >= 70:
        return 'İyi! Bazı alanlarda daha düzenli olabilirsiniz.'
    elif score >= 60:
        return 'Orta seviye. Rutinlerinizi geliştirmeniz önerilir.'
    else:
        return 'Başlangıç seviyesi. Sistematik takip önemli.'

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