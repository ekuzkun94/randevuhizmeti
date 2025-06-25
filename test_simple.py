#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

# Simple app config
app = Flask(__name__)
app.config['SECRET_KEY'] = 'test-secret-key'
app.config['DEBUG'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_simple.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
CORS(app)

@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': 'ZamanYönet API Test v1.0',
        'timestamp': datetime.now(timezone.utc).isoformat()
    })

@app.route('/health')
def health():
    try:
        # Test database connection
        db.session.execute(db.text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print('✅ Test database created')
    
    print('🚀 Starting simple test server...')
    app.run(debug=True, port=5001, host='0.0.0.0') 