#!/usr/bin/env python3
"""
Basic Test API for Supabase Integration Testing
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import jwt
import bcrypt
from datetime import datetime, timedelta

app = Flask(__name__)
app.config['SECRET_KEY'] = 'test-secret-key'

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': '🕒 ZamanYönet Basic API Test',
        'status': 'active',
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': ['/', '/health', '/test-jwt', '/test-bcrypt']
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0-test',
        'database': 'test-mode',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/test-jwt', methods=['POST'])
def test_jwt():
    try:
        data = request.get_json() or {}
        
        # Create test token
        payload = {
            'user_id': data.get('user_id', 'test-123'),
            'email': data.get('email', 'test@example.com'),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'JWT test successful',
            'token': token,
            'payload': payload
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/test-bcrypt', methods=['POST'])
def test_bcrypt():
    try:
        data = request.get_json() or {}
        password = data.get('password', 'test123')
        
        # Hash password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # Verify password
        is_valid = bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        
        return jsonify({
            'message': 'Bcrypt test successful',
            'password': password,
            'hashed': hashed,
            'verification': is_valid
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Basic Test API...")
    print("📍 Available at: http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)
