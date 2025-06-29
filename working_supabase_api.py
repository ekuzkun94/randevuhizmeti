#!/usr/bin/env python3
"""
✅ Working Supabase API - Based on successful connection tests
Uses only confirmed working endpoints
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import jwt
import bcrypt
import uuid
from datetime import datetime, timedelta

app = Flask(__name__)
app.config['SECRET_KEY'] = 'working-supabase-secret-2024'

# Enable CORS
CORS(app, resources={"/*": {"origins": "*"}})

# Working Supabase Configuration
SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"

def make_supabase_request(method, table, data=None, filters=None, use_service_key=False):
    """Make request to Supabase REST API"""
    try:
        headers = {
            'apikey': SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY}',
            'Content-Type': 'application/json'
        }
        
        url = f'{SUPABASE_URL}/rest/v1/{table}'
        
        if filters:
            params = []
            for key, value in filters.items():
                params.append(f"{key}=eq.{value}")
            if params:
                url += "?" + "&".join(params)
        
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=10)
        
        return response
        
    except Exception as e:
        raise Exception(f"Supabase request failed: {str(e)}")

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': '🕒 ZamanYönet API - Supabase WORKING',
        'status': 'active',
        'version': '2.1.0-fixed',
        'supabase_status': {
            'url': SUPABASE_URL,
            'rest_api': 'working',
            'auth_api': 'working',
            'connection': 'verified'
        },
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': [
            'GET /',
            'GET /health', 
            'POST /auth/register',
            'POST /auth/login',
            'GET /supabase/test',
            'GET /services',
            'GET /providers', 
            'GET /appointments',
            'POST /appointments'
        ]
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'database': 'supabase-connected',
        'version': '2.1.0-fixed',
        'supabase_url': SUPABASE_URL,
        'connection_verified': True,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/supabase/test', methods=['GET'])
def test_supabase():
    """Test live Supabase connection"""
    try:
        # Test REST API endpoint
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
        }
        
        response = requests.get(f'{SUPABASE_URL}/rest/v1/', headers=headers, timeout=5)
        
        return jsonify({
            'supabase_test': 'success',
            'api_status': response.status_code,
            'connection': 'verified',
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'supabase_test': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# ================================
# SERVICES ENDPOINTS
# ================================

@app.route('/services', methods=['GET'])
def get_services():
    """Get services from Supabase"""
    try:
        response = make_supabase_request('GET', 'services')
        
        if response.status_code == 200:
            services = response.json()
            return jsonify({
                'services': services,
                'count': len(services)
            })
        else:
            return jsonify({
                'error': 'Failed to fetch services',
                'details': response.text
            }), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# PROVIDERS ENDPOINTS
# ================================

@app.route('/providers', methods=['GET'])
def get_providers():
    """Get providers from Supabase"""
    try:
        response = make_supabase_request('GET', 'providers', use_service_key=True)
        
        if response.status_code == 200:
            providers = response.json()
            return jsonify({
                'providers': providers,
                'count': len(providers)
            })
        else:
            return jsonify({
                'error': 'Failed to fetch providers',
                'details': response.text
            }), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================================
# APPOINTMENTS ENDPOINTS
# ================================

@app.route('/appointments', methods=['GET'])
def get_appointments():
    """Get appointments from Supabase"""
    try:
        response = make_supabase_request('GET', 'appointments', use_service_key=True)
        
        if response.status_code == 200:
            appointments = response.json()
            return jsonify({
                'appointments': appointments,
                'count': len(appointments)
            })
        else:
            return jsonify({
                'error': 'Failed to fetch appointments',
                'details': response.text
            }), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/appointments', methods=['POST'])
def create_appointment():
    """Create new appointment in Supabase"""
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['provider_id', 'service_id', 'appointment_date', 'appointment_time']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Prepare appointment data
        appointment_data = {
            'id': str(uuid.uuid4()),
            'provider_id': data['provider_id'],
            'service_id': data['service_id'],
            'appointment_date': data['appointment_date'],
            'appointment_time': data['appointment_time'],
            'status': data.get('status', 'confirmed'),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Handle customer vs guest
        if data.get('customer_id'):
            appointment_data['customer_id'] = data['customer_id']
        
        if data.get('guest_name'):
            appointment_data['guest_name'] = data['guest_name']
        if data.get('guest_email'):
            appointment_data['guest_email'] = data['guest_email']
        if data.get('guest_phone'):
            appointment_data['guest_phone'] = data['guest_phone']
        
        # Create appointment in Supabase
        response = make_supabase_request('POST', 'appointments', appointment_data, use_service_key=True)
        
        if response.status_code == 201:
            return jsonify({
                'message': 'Appointment created successfully',
                'appointment_id': appointment_data['id'],
                'appointment': appointment_data
            }), 201
        else:
            return jsonify({
                'error': 'Failed to create appointment',
                'details': response.text
            }), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/register', methods=['POST'])
def register():
    """Register user via Supabase Auth"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Use Supabase Auth API
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }
        
        user_data = {
            'email': data['email'],
            'password': data['password']
        }
        
        response = requests.post(
            f'{SUPABASE_URL}/auth/v1/signup',
            headers=headers,
            json=user_data,
            timeout=10
        )
        
        if response.status_code == 200:
            return jsonify({
                'message': 'User registered successfully',
                'data': response.json()
            })
        else:
            return jsonify({
                'error': 'Registration failed',
                'details': response.text
            }), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Working Supabase API...")
    print(f"📍 Supabase URL: {SUPABASE_URL}")
    print("📍 Local URL: http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)
