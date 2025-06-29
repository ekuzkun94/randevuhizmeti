#!/usr/bin/env python3
"""
🧪 ZamanYönet Basic API Test (Database-free)
Supabase entegrasyonu kontrolü için temel testler
"""

import requests
import json
import sys
from datetime import datetime

class BasicAPITester:
    def __init__(self):
        self.local_port = 8000
        self.base_url = f"http://localhost:{self.local_port}"
        
    def test_imports(self):
        """Test required imports"""
        print("🔍 Testing imports...")
        
        try:
            from flask import Flask
            from flask_cors import CORS
            import jwt
            import bcrypt
            print("✅ All imports successful")
            return True
        except ImportError as e:
            print(f"❌ Import failed: {e}")
            return False
    
    def test_supabase_config(self):
        """Test Supabase configuration"""
        print("🔍 Testing Supabase config...")
        
        try:
            from supabase_config import SupabaseConfig
            config = SupabaseConfig()
            
            print(f"✅ Supabase URL: {config.SUPABASE_URL}")
            print(f"✅ Database configs: {len(config.DATABASE_CONFIGS)}")
            
            # Check if URLs are valid format
            if 'supabase.co' in config.SUPABASE_URL:
                print("✅ Supabase URL format valid")
            else:
                print("❌ Supabase URL format invalid")
                return False
                
            return True
        except Exception as e:
            print(f"❌ Supabase config error: {e}")
            return False
    
    def test_jwt_functionality(self):
        """Test JWT functionality"""
        print("🔍 Testing JWT functionality...")
        
        try:
            import jwt
            
            # Test data
            test_payload = {
                'user_id': 'test-123',
                'email': 'test@example.com',
                'role': 'customer'
            }
            secret = 'test-secret-key'
            
            # Encode
            token = jwt.encode(test_payload, secret, algorithm='HS256')
            print(f"✅ JWT encoding successful: {token[:30]}...")
            
            # Decode
            decoded = jwt.decode(token, secret, algorithms=['HS256'])
            print(f"✅ JWT decoding successful: {decoded['email']}")
            
            return True
        except Exception as e:
            print(f"❌ JWT test failed: {e}")
            return False
    
    def test_bcrypt_functionality(self):
        """Test bcrypt functionality"""
        print("🔍 Testing bcrypt functionality...")
        
        try:
            import bcrypt
            
            password = "test123456"
            
            # Hash password
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
            print("✅ Password hashing successful")
            
            # Verify password
            is_valid = bcrypt.checkpw(password.encode('utf-8'), hashed)
            print(f"✅ Password verification: {is_valid}")
            
            return True
        except Exception as e:
            print(f"❌ Bcrypt test failed: {e}")
            return False
    
    def test_cors_setup(self):
        """Test CORS setup"""
        print("🔍 Testing CORS setup...")
        
        try:
            from flask import Flask
            from flask_cors import CORS
            
            app = Flask(__name__)
            CORS(app, resources={
                r"/*": {
                    "origins": "*",
                    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                    "allow_headers": ["Content-Type", "Authorization"]
                }
            })
            
            print("✅ CORS configuration successful")
            return True
        except Exception as e:
            print(f"❌ CORS setup failed: {e}")
            return False
    
    def create_basic_api(self):
        """Create a basic API for testing"""
        print("🔍 Creating basic API...")
        
        basic_api_code = '''#!/usr/bin/env python3
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
'''
        
        with open('basic_test_api.py', 'w') as f:
            f.write(basic_api_code)
        
        print("✅ Basic API created: basic_test_api.py")
        return True
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 ZamanYönet Supabase Integration Control")
        print("=" * 50)
        
        tests = [
            ("Import Test", self.test_imports),
            ("Supabase Config", self.test_supabase_config),
            ("JWT Functionality", self.test_jwt_functionality),
            ("Bcrypt Functionality", self.test_bcrypt_functionality),
            ("CORS Setup", self.test_cors_setup),
            ("Basic API Creation", self.create_basic_api)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 {test_name}...")
            if test_func():
                passed += 1
                print(f"✅ {test_name} PASSED")
            else:
                print(f"❌ {test_name} FAILED")
        
        print(f"\n📊 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All basic tests PASSED!")
            print("\n🎯 Next Steps:")
            print("  1. Fix Supabase database connection")
            print("  2. Update credentials in supabase_config.py")
            print("  3. Deploy to production")
            print("  4. Test production API")
            print("\n🚀 To test basic API:")
            print("  python basic_test_api.py")
            print("  curl http://localhost:8000/health")
        else:
            print("⚠️ Some tests failed. Check configurations.")
        
        return passed == total

if __name__ == "__main__":
    tester = BasicAPITester()
    tester.run_all_tests() 