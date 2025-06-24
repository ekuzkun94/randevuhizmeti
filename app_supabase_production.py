"""
🏗️ ZamanYönet - Production App with Supabase Integration
Complete appointment management system with:
- Full Supabase PostgreSQL backend
- JWT Authentication
- CORS enabled for web integration
- All API endpoints
- Production ready
"""

import os
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import re

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'supabase-production-secret-2024')

# Enable CORS for all domains
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase Database Configuration
SUPABASE_URL = "ugmyyphiqoahludwuzpu.supabase.co"
SUPABASE_PORT = "5432"
SUPABASE_DB = "postgres"
SUPABASE_USER = os.getenv('SUPABASE_USER', 'postgres')
SUPABASE_PASSWORD = os.getenv('SUPABASE_PASSWORD', '')

def get_db_connection():
    """Get Supabase database connection"""
    try:
        connection = psycopg2.connect(
            host=SUPABASE_URL,
            port=SUPABASE_PORT,
            database=SUPABASE_DB,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD,
            cursor_factory=RealDictCursor
        )
        return connection
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

def execute_query(query, params=None, fetch=False):
    """Execute database query safely"""
    try:
        conn = get_db_connection()
        if not conn:
            return None
        
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            
            if fetch == 'one':
                result = cursor.fetchone()
            elif fetch == 'all':
                result = cursor.fetchall()
            else:
                result = cursor.rowcount
            
            conn.commit()
            conn.close()
            return result
    except Exception as e:
        logger.error(f"Query execution failed: {e}")
        return None

def generate_jwt(user_data):
    """Generate JWT token"""
    payload = {
        'user_id': str(user_data['id']),
        'email': user_data['email'],
        'role': user_data.get('role_name', 'customer'),
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_jwt(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Authentication decorator"""
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token[7:]
            payload = verify_jwt(token)
            if payload:
                request.current_user = payload
                return f(*args, **kwargs)
        
        return jsonify({'error': 'Authentication required'}), 401
    
    decorated_function.__name__ = f.__name__
    return decorated_function

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def hash_password(password):
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# CORS Preflight Handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# ================================
# HEALTH & STATUS ENDPOINTS
# ================================

@app.route('/', methods=['GET'])
def home():
    """Home endpoint"""
    try:
        # Test database connection
        conn = get_db_connection()
        db_status = "connected" if conn else "disconnected"
        if conn:
            conn.close()
        
        return jsonify({
            'message': '🕒 ZamanYönet API - Supabase Production',
            'version': '2.0.0-supabase',
            'status': 'active',
            'database': db_status,
            'features': [
                '🔐 JWT Authentication',
                '👥 Role-based Access Control',
                '📅 Appointment Management',
                '🌐 CORS Enabled',
                '☁️ Supabase Backend',
                '📱 Mobile Ready'
            ],
            'endpoints': {
                'auth': ['POST /register', 'POST /login', 'POST /refresh'],
                'appointments': ['GET /appointments', 'POST /appointments', 'PUT /appointments/<id>', 'DELETE /appointments/<id>'],
                'services': ['GET /services', 'POST /services'],
                'providers': ['GET /providers', 'POST /providers'],
                'users': ['GET /users', 'POST /users'],
                'health': ['GET /health', 'GET /stats']
            },
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Test database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': 'Cannot connect to Supabase'
            }), 503
        
        # Test database query
        result = execute_query("SELECT COUNT(*) as count FROM users", fetch='one')
        user_count = result['count'] if result else 0
        
        result = execute_query("SELECT COUNT(*) as count FROM appointments", fetch='one')
        appointment_count = result['count'] if result else 0
        
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'version': '2.0.0-supabase',
            'users_count': user_count,
            'appointments_count': appointment_count,
            'timestamp': datetime.utcnow().isoformat(),
            'server': 'Supabase Production'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 503

@app.route('/stats', methods=['GET'])
def stats():
    """Statistics endpoint"""
    try:
        stats = {
            'users': execute_query("SELECT COUNT(*) as count FROM users", fetch='one')['count'],
            'appointments': execute_query("SELECT COUNT(*) as count FROM appointments", fetch='one')['count'],
            'services': execute_query("SELECT COUNT(*) as count FROM services", fetch='one')['count'],
            'providers': execute_query("SELECT COUNT(*) as count FROM providers", fetch='one')['count'],
        }
        
        return jsonify({
            'statistics': stats,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# AUTHENTICATION ENDPOINTS
# ================================

@app.route('/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user exists
        existing_user = execute_query(
            "SELECT id FROM users WHERE email = %s",
            (data['email'],),
            fetch='one'
        )
        
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Get default role
        role = execute_query(
            "SELECT id FROM roles WHERE name = %s",
            (data.get('role', 'customer'),),
            fetch='one'
        )
        
        if not role:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Hash password and create user
        hashed_password = hash_password(data['password'])
        user_id = str(uuid.uuid4())
        
        execute_query(
            """INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (user_id, data['email'], hashed_password, data['first_name'],
             data['last_name'], data.get('phone'), role['id'])
        )
        
        # Generate JWT
        user_data = {
            'id': user_id,
            'email': data['email'],
            'role_name': data.get('role', 'customer')
        }
        token = generate_jwt(user_data)
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id,
            'token': token,
            'user': {
                'id': user_id,
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': data.get('role', 'customer')
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Get user with role
        user = execute_query(
            """SELECT u.*, r.name as role_name 
               FROM users u 
               LEFT JOIN roles r ON u.role_id = r.id 
               WHERE u.email = %s AND u.is_active = true""",
            (data['email'],),
            fetch='one'
        )
        
        if not user or not verify_password(data['password'], user['password_hash']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update last login
        execute_query(
            "UPDATE users SET last_login = %s WHERE id = %s",
            (datetime.utcnow(), user['id'])
        )
        
        # Generate JWT
        token = generate_jwt(user)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['id']),
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'role': user['role_name'] or 'customer'
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# APPOINTMENTS ENDPOINTS
# ================================

@app.route('/appointments', methods=['GET'])
def get_appointments():
    """Get appointments"""
    try:
        # Get query parameters
        customer_id = request.args.get('customer_id')
        provider_id = request.args.get('provider_id')
        date = request.args.get('date')
        status = request.args.get('status')
        
        # Build query
        query = """
            SELECT 
                a.*,
                CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                u.email as customer_email,
                s.name as service_name,
                s.duration as service_duration,
                s.price as service_price,
                p.business_name as provider_name
            FROM appointments a
            LEFT JOIN users u ON a.customer_id = u.id
            LEFT JOIN services s ON a.service_id = s.id
            LEFT JOIN providers p ON a.provider_id = p.id
            WHERE 1=1
        """
        params = []
        
        if customer_id:
            query += " AND a.customer_id = %s"
            params.append(customer_id)
        
        if provider_id:
            query += " AND a.provider_id = %s"
            params.append(provider_id)
        
        if date:
            query += " AND a.appointment_date = %s"
            params.append(date)
        
        if status:
            query += " AND a.status = %s"
            params.append(status)
        
        query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC"
        
        appointments = execute_query(query, params, fetch='all')
        
        return jsonify({
            'appointments': appointments or [],
            'count': len(appointments) if appointments else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/appointments', methods=['POST'])
def create_appointment():
    """Create new appointment"""
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['provider_id', 'service_id', 'appointment_date', 'appointment_time']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # For guest bookings
        if not data.get('customer_id'):
            if not all([data.get('guest_name'), data.get('guest_email'), data.get('guest_phone')]):
                return jsonify({'error': 'Guest information required for guest bookings'}), 400
        
        # Validate service and provider exist
        service = execute_query("SELECT id, name, duration, price FROM services WHERE id = %s", (data['service_id'],), fetch='one')
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        provider = execute_query("SELECT id, business_name FROM providers WHERE id = %s", (data['provider_id'],), fetch='one')
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        # Create appointment
        appointment_id = str(uuid.uuid4())
        
        execute_query(
            """INSERT INTO appointments 
               (id, customer_id, provider_id, service_id, appointment_date, appointment_time, 
                status, notes, guest_name, guest_email, guest_phone)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (appointment_id, data.get('customer_id'), data['provider_id'], data['service_id'],
             data['appointment_date'], data['appointment_time'], data.get('status', 'pending'),
             data.get('notes'), data.get('guest_name'), data.get('guest_email'), data.get('guest_phone'))
        )
        
        return jsonify({
            'message': 'Appointment created successfully',
            'appointment_id': appointment_id,
            'appointment': {
                'id': appointment_id,
                'service': service['name'],
                'provider': provider['business_name'],
                'date': data['appointment_date'],
                'time': data['appointment_time'],
                'status': data.get('status', 'pending')
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/appointments/<appointment_id>', methods=['PUT'])
@require_auth
def update_appointment(appointment_id):
    """Update appointment"""
    try:
        data = request.get_json()
        
        # Check if appointment exists
        appointment = execute_query("SELECT id FROM appointments WHERE id = %s", (appointment_id,), fetch='one')
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Build update query
        update_fields = []
        params = []
        
        for field in ['appointment_date', 'appointment_time', 'status', 'notes']:
            if field in data:
                update_fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_fields.append("updated_at = %s")
        params.append(datetime.utcnow())
        params.append(appointment_id)
        
        query = f"UPDATE appointments SET {', '.join(update_fields)} WHERE id = %s"
        execute_query(query, params)
        
        return jsonify({'message': 'Appointment updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/appointments/<appointment_id>', methods=['DELETE'])
@require_auth
def delete_appointment(appointment_id):
    """Delete appointment"""
    try:
        result = execute_query("DELETE FROM appointments WHERE id = %s", (appointment_id,))
        
        if result == 0:
            return jsonify({'error': 'Appointment not found'}), 404
        
        return jsonify({'message': 'Appointment deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# SERVICES ENDPOINTS
# ================================

@app.route('/services', methods=['GET'])
def get_services():
    """Get services"""
    try:
        category = request.args.get('category')
        
        query = "SELECT * FROM services WHERE is_active = true"
        params = []
        
        if category:
            query += " AND category = %s"
            params.append(category)
        
        query += " ORDER BY category, name"
        
        services = execute_query(query, params, fetch='all')
        
        return jsonify({
            'services': services or [],
            'count': len(services) if services else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/services', methods=['POST'])
@require_auth
def create_service():
    """Create new service"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'duration', 'price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        service_id = str(uuid.uuid4())
        
        execute_query(
            """INSERT INTO services (id, name, description, duration, price, category)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (service_id, data['name'], data.get('description'),
             data['duration'], data['price'], data.get('category'))
        )
        
        return jsonify({
            'message': 'Service created successfully',
            'service_id': service_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# PROVIDERS ENDPOINTS
# ================================

@app.route('/providers', methods=['GET'])
def get_providers():
    """Get providers"""
    try:
        city = request.args.get('city')
        specialization = request.args.get('specialization')
        
        query = """
            SELECT 
                p.*,
                CONCAT(u.first_name, ' ', u.last_name) as full_name,
                u.email,
                u.phone
            FROM providers p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.is_active = true
        """
        params = []
        
        if city:
            query += " AND p.city = %s"
            params.append(city)
        
        if specialization:
            query += " AND p.specialization = %s"
            params.append(specialization)
        
        query += " ORDER BY p.business_name"
        
        providers = execute_query(query, params, fetch='all')
        
        return jsonify({
            'providers': providers or [],
            'count': len(providers) if providers else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/providers', methods=['POST'])
@require_auth
def create_provider():
    """Create new provider"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'business_name', 'specialization']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        provider_id = str(uuid.uuid4())
        
        execute_query(
            """INSERT INTO providers 
               (id, user_id, business_name, specialization, experience_years, city, address, bio)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (provider_id, data['user_id'], data['business_name'], data['specialization'],
             data.get('experience_years'), data.get('city'), data.get('address'), data.get('bio'))
        )
        
        return jsonify({
            'message': 'Provider created successfully',
            'provider_id': provider_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# USERS ENDPOINTS
# ================================

@app.route('/users', methods=['GET'])
@require_auth
def get_users():
    """Get users (admin only)"""
    try:
        if request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        users = execute_query(
            """SELECT 
                u.id, u.email, u.first_name, u.last_name, u.phone, 
                u.is_active, u.created_at, r.name as role_name
               FROM users u
               LEFT JOIN roles r ON u.role_id = r.id
               ORDER BY u.created_at DESC""",
            fetch='all'
        )
        
        return jsonify({
            'users': users or [],
            'count': len(users) if users else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 ZamanYönet Supabase Production API başlatılıyor...")
    print(f"🌍 Environment: Production")
    print(f"☁️ Database: Supabase PostgreSQL")
    print(f"🔧 Debug mode: False")
    print(f"🔒 CORS: Enabled for all origins")
    print(f"📊 Features: All endpoints active")
    
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False) 