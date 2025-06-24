"""
ZamanYönet Extreme Minimal - No Dependencies, Guaranteed Render Success
Just Flask + Gunicorn - Nothing else
"""
import os
import json
from datetime import datetime
from flask import Flask, request, jsonify

# Initialize Flask app
app = Flask(__name__)

# CORS support - Add headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Handle preflight requests
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = jsonify({'status': 'OK'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Simple in-memory data storage for demo
users = []
appointments = []

# Helper functions
def generate_id():
    return len(users) + len(appointments) + 1

def find_user(email):
    return next((user for user in users if user['email'] == email), None)

# Routes
@app.route('/')
def home():
    return jsonify({
        'message': 'ZamanYönet API - Extreme Minimal Version',
        'version': '1.0.0-extreme-minimal',
        'status': 'running',
        'info': 'No database, no dependencies - guaranteed to work!',
        'endpoints': {
            'health': 'GET /health',
            'register': 'POST /register',
            'login': 'POST /login',
            'appointments': 'GET /appointments',
            'create_appointment': 'POST /appointments'
        },
        'note': 'This is a demo version - data is stored in memory'
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0-extreme-minimal',
        'database': 'in-memory (demo)',
        'users_count': len(users),
        'appointments_count': len(appointments)
    })

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Check if user exists
        if find_user(data['email']):
            return jsonify({'error': 'User already exists'}), 400
        
        # Create user
        user = {
            'id': generate_id(),
            'email': data['email'],
            'password': data['password'],  # In real app, this would be hashed
            'role': data.get('role', 'customer'),
            'created_at': datetime.utcnow().isoformat()
        }
        
        users.append(user)
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': user['id'],
                'email': user['email'],
                'role': user['role']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        user = find_user(data['email'])
        
        if not user or user['password'] != data['password']:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'email': user['email'],
                'role': user['role']
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@app.route('/appointments', methods=['GET'])
def get_appointments():
    try:
        return jsonify({
            'appointments': appointments,
            'count': len(appointments)
        })
    except Exception as e:
        return jsonify({'error': f'Failed to get appointments: {str(e)}'}), 500

@app.route('/appointments', methods=['POST'])
def create_appointment():
    try:
        data = request.get_json()
        
        if not data or not data.get('service_name') or not data.get('customer_email'):
            return jsonify({'error': 'Service name and customer email required'}), 400
        
        appointment = {
            'id': generate_id(),
            'customer_email': data['customer_email'],
            'service_name': data['service_name'],
            'appointment_date': data.get('appointment_date', datetime.utcnow().isoformat()),
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat()
        }
        
        appointments.append(appointment)
        
        return jsonify({
            'message': 'Appointment created successfully',
            'appointment': appointment
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create appointment: {str(e)}'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False) 