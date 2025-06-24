"""
ZamanYönet Ultra Minimal Production App for Render.com
Minimal dependencies - no advanced features initially
"""
import os
import secrets
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# Initialize Flask app
app = Flask(__name__)

# Ultra minimal configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_urlsafe(32))
app.config['DEBUG'] = os.environ.get('DEBUG', 'false').lower() == 'true'

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql+pg8000://', 1)
    elif not DATABASE_URL.startswith('postgresql+pg8000://'):
        DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+pg8000://', 1)
else:
    # Default to Supabase
    SUPABASE_PASSWORD = os.environ.get('SUPABASE_PASSWORD', 'your_password_here')
    DATABASE_URL = f"postgresql+pg8000://postgres.ugmyyphiqoahludwuzpu:{SUPABASE_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
CORS(app, origins=['*'])  # Simple CORS for now

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', app.config['SECRET_KEY'])
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

# Simple Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='customer')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    provider_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    service_name = db.Column(db.String(100), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Simple JWT utilities
def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + ACCESS_TOKEN_EXPIRES,
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        return None

# Simple auth decorator
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid authorization header'}), 401
        
        if not token:
            return jsonify({'error': 'Token required'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        g.current_user_id = payload['user_id']
        g.current_user_role = payload['role']
        return f(*args, **kwargs)
    
    return decorated

# API Routes
@app.route('/')
def home():
    return jsonify({
        'message': 'ZamanYönet API - Ultra Minimal Version',
        'version': '1.0.0-minimal',
        'status': 'running',
        'endpoints': [
            'GET /',
            'GET /health',
            'POST /auth/register',
            'POST /auth/login',
            'GET /appointments',
            'POST /appointments'
        ]
    })

@app.route('/health')
def health():
    try:
        # Test database connection
        db.session.execute(db.text('SELECT 1'))
        db_status = 'connected'
        status_code = 200
    except Exception as e:
        db_status = f'disconnected: {str(e)[:100]}'
        status_code = 503
    
    return jsonify({
        'status': 'healthy' if db_status == 'connected' else 'unhealthy',
        'database': db_status,
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0-minimal'
    }), status_code

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    # Check if user exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User already exists'}), 400
    
    # Create user
    user = User(
        email=data['email'],
        role=data.get('role', 'customer')
    )
    user.set_password(data['password'])
    
    try:
        db.session.add(user)
        db.session.commit()
        
        token = generate_token(user.id, user.role)
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = generate_token(user.id, user.role)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role
        }
    })

@app.route('/appointments', methods=['GET'])
@require_auth
def get_appointments():
    appointments = Appointment.query.filter_by(customer_id=g.current_user_id).all()
    
    return jsonify({
        'appointments': [{
            'id': apt.id,
            'service_name': apt.service_name,
            'appointment_date': apt.appointment_date.isoformat(),
            'status': apt.status
        } for apt in appointments]
    })

@app.route('/appointments', methods=['POST'])
@require_auth
def create_appointment():
    data = request.get_json()
    
    if not data or not data.get('service_name') or not data.get('appointment_date'):
        return jsonify({'error': 'Service name and appointment date required'}), 400
    
    appointment = Appointment(
        customer_id=g.current_user_id,
        provider_id=data.get('provider_id', 1),  # Default provider
        service_name=data['service_name'],
        appointment_date=datetime.fromisoformat(data['appointment_date'].replace('Z', '+00:00'))
    )
    
    try:
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment created successfully',
            'appointment': {
                'id': appointment.id,
                'service_name': appointment.service_name,
                'appointment_date': appointment.appointment_date.isoformat(),
                'status': appointment.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create appointment'}), 500

# Create tables
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created successfully")
        
        # Create default admin user if not exists
        if not User.query.filter_by(email='admin@zamanyonet.com').first():
            admin = User(email='admin@zamanyonet.com', role='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("✅ Default admin user created")
            
    except Exception as e:
        print(f"⚠️ Database setup failed: {e}")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG']) 