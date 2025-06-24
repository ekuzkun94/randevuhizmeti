#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import bcrypt
import jwt
import uuid
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app, g
from typing import Optional, Dict, Any, Union
from werkzeug.security import generate_password_hash, check_password_hash

# Try to import bcrypt, fallback to hashlib if not available
try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False

class SecurityUtils:
    """Güvenlik işlemleri için utility sınıfı"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Şifreyi güvenli bir şekilde hashle"""
        if BCRYPT_AVAILABLE and current_app.config.get('USE_BCRYPT', True):
            # bcrypt kullan
            rounds = current_app.config.get('BCRYPT_LOG_ROUNDS', 12)
            salt = bcrypt.gensalt(rounds=rounds)
            return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        else:
            # Fallback to werkzeug's password hashing
            return generate_password_hash(password, method='pbkdf2:sha256:150000')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Şifreyi hash ile karşılaştır"""
        if not password or not hashed:
            return False
        
        try:
            if BCRYPT_AVAILABLE and hashed.startswith('$2b$'):
                # bcrypt hash detected
                return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
            else:
                # werkzeug hash or fallback
                return check_password_hash(hashed, password)
        except Exception:
            return False
    
    @staticmethod
    def generate_token(user_data: Dict[str, Any], expires_in: timedelta = None) -> str:
        """JWT token oluştur"""
        if expires_in is None:
            expires_in = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', timedelta(hours=1))
        
        payload = {
            'user_id': user_data.get('id'),
            'email': user_data.get('email'),
            'role_id': user_data.get('role_id'),
            'iat': datetime.now(timezone.utc),
            'exp': datetime.now(timezone.utc) + expires_in,
            'jti': str(uuid.uuid4())  # JWT ID for token revocation
        }
        
        return jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
    
    @staticmethod
    def generate_refresh_token(user_id: str) -> str:
        """Refresh token oluştur"""
        payload = {
            'user_id': user_id,
            'type': 'refresh',
            'iat': datetime.now(timezone.utc),
            'exp': datetime.now(timezone.utc) + current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', timedelta(days=30)),
            'jti': str(uuid.uuid4())
        }
        
        return jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """JWT token doğrula"""
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Token süre kontrolü
            if datetime.fromtimestamp(payload['exp'], timezone.utc) < datetime.now(timezone.utc):
                return None
            
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception:
            return None
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Güvenli rastgele token oluştur"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def generate_password_reset_token(email: str) -> str:
        """Şifre sıfırlama token'ı oluştur"""
        data = f"{email}:{datetime.now(timezone.utc).isoformat()}:{secrets.token_urlsafe(16)}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Email formatını doğrula"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """Şifre gücünü kontrol et"""
        errors = []
        strength_score = 0
        
        if len(password) < 8:
            errors.append("Şifre en az 8 karakter olmalıdır")
        else:
            strength_score += 1
        
        if not any(c.islower() for c in password):
            errors.append("En az bir küçük harf içermelidir")
        else:
            strength_score += 1
        
        if not any(c.isupper() for c in password):
            errors.append("En az bir büyük harf içermelidir")
        else:
            strength_score += 1
        
        if not any(c.isdigit() for c in password):
            errors.append("En az bir rakam içermelidir")
        else:
            strength_score += 1
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("En az bir özel karakter içermelidir")
        else:
            strength_score += 1
        
        strength_levels = ["Çok Zayıf", "Zayıf", "Orta", "İyi", "Güçlü", "Çok Güçlü"]
        strength_level = strength_levels[min(strength_score, 5)]
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'strength_score': strength_score,
            'strength_level': strength_level
        }

def require_auth(f):
    """Authentication decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Bearer token kontrolü
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # "Bearer TOKEN"
            except IndexError:
                return jsonify({'error': 'Geçersiz authorization header formatı'}), 401
        
        if not token:
            return jsonify({'error': 'Token gerekli'}), 401
        
        # Token doğrulama
        payload = SecurityUtils.verify_token(token)
        if not payload:
            return jsonify({'error': 'Geçersiz token'}), 401
        
        # Request'e user bilgilerini ekle
        g.current_user_id = payload['user_id']
        g.current_user_role = payload['role_id']
        g.token_type = payload.get('type', 'access')
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(allowed_roles):
    """Role-based authorization decorator"""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            user_role = g.current_user_role
            
            if user_role not in allowed_roles:
                return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

class RateLimiter:
    """Rate limiting için sınıf"""
    
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """Rate limit kontrolü"""
        now = datetime.now(timezone.utc)
        
        if key not in self.requests:
            self.requests[key] = []
        
        # Eski istekleri temizle
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if now - req_time < timedelta(seconds=window)
        ]
        
        # Limit kontrolü
        if len(self.requests[key]) >= limit:
            return False
        
        # Yeni isteği ekle
        self.requests[key].append(now)
        return True

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit(limit: int = 100, window: int = 3600):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # IP adresini key olarak kullan
            key = request.remote_addr
            
            if not rate_limiter.is_allowed(key, limit, window):
                return jsonify({
                    'error': 'Rate limit aşıldı',
                    'message': f'Dakikada en fazla {limit} istek yapabilirsiniz'
                }), 429
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator 