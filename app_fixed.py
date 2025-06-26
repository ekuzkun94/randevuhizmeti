#!/usr/bin/env python3
"""
ZamanYönet AI Enhanced - Main Application
A Flask-based appointment management system with AI capabilities
"""

import os
from datetime import datetime, timezone, timedelta

# Import required packages with error handling
try:
    from flask import Flask, jsonify
    from flask_sqlalchemy import SQLAlchemy
    from flask_jwt_extended import JWTManager
    from flask_cors import CORS
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Error importing required packages: {e}")
    print("Please install required packages: pip install flask flask-sqlalchemy flask-jwt-extended flask-cors python-dotenv")
    raise
except ImportError as e:
    print(f"Error importing required packages: {e}")
    print("Please install required packages: pip install flask flask-sqlalchemy flask-jwt-extended flask-cors python-dotenv")
    raise
except ImportError as e:
    print(f"Error importing required packages: {e}")
    print("Please install required packages: pip install flask flask-sqlalchemy flask-jwt-extended flask-cors python-dotenv")
    raise

# Load environment variables
load_dotenv()

def create_app():
    """Application factory pattern - ZamanYönet AI Enhanced"""
    
    app = Flask(__name__)
    
    # === CONFIGURATION ===
    app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'
    app.config['DEBUG'] = True
    
    # Database - SQLite for development
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    instance_dir = os.path.join(BASE_DIR, 'instance')
    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(instance_dir, 'randevu.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT settings
    app.config['JWT_SECRET_KEY'] = 'jwt-secret-change-in-production'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    # === EXTENSIONS ===
    from models.models import db
    db.init_app(app)
    
    jwt = JWTManager(app)
    
    CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])
    
    # === ROUTES ===
    @app.route('/')
    def home():
        return jsonify({
            'status': 'success',
            'message': 'ZamanYönet AI Enhanced API v2.0',
            'version': '2.0.0',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    @app.route('/health')
    def health():
        try:
            db.session.execute(db.text('SELECT 1'))
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'version': '2.0.0',
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 503
    
    # AI Dashboard endpoint
    @app.route('/ai/personalized-dashboard/<customer_id>')
    def ai_dashboard(customer_id):
        return jsonify({
            'customer_id': customer_id,
            'recommendations': [
                {
                    'type': 'time_optimization',
                    'title': 'Sabah Saatleri Daha Produktif',
                    'description': 'Verilerinize göre sabah 09:00-11:00 saatleri en aktif.',
                    'confidence_score': 0.85
                }
            ],
            'quick_stats': {
                'total_appointments': 0,
                'completed_tasks': 0
            },
            'status': 'success'
        })
    
    # === DATABASE INIT ===
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database created successfully")
        except Exception as e:
            print(f"⚠️ Database error: {e}")
    
    return app

# Create app
app = create_app()

if __name__ == '__main__':
    print("🚀 ZamanYönet AI Enhanced API v2.0 başlatılıyor...")
    app.run(debug=True, port=5001, host='0.0.0.0') 