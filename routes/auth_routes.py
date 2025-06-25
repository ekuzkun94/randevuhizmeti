#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, timezone
import uuid

from models.models import db, User, PasswordReset
from utils.security import SecurityUtils, rate_limit
from utils.logger import security_logger, app_logger
from utils.validators import validate_request_data

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
@rate_limit(limit=5, window=300)  # 5 attempts per 5 minutes
def login():
    """Kullanıcı girişi"""
    try:
        # Request validation
        validation_rules = {
            'email': {'required': True, 'type': 'email'},
            'password': {'required': True, 'type': 'string', 'min_length': 1}
        }
        
        data, errors = validate_request_data(request.json, validation_rules)
        if errors:
            return jsonify({'error': 'Geçersiz veri', 'details': errors}), 400
        
        email = data['email']
        password = data['password']
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        
        # Email formatını kontrol et
        if not SecurityUtils.validate_email(email):
            security_logger.log_failed_authentication(email, 'invalid_email_format', ip_address)
            return jsonify({'error': 'Geçersiz email formatı'}), 400
        
        # Kullanıcıyı bul
        user = User.get_by_email(email)
        if not user:
            security_logger.log_failed_authentication(email, 'user_not_found', ip_address)
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 401
        
        # Kullanıcı aktif mi kontrol et
        if not user.is_active:
            security_logger.log_failed_authentication(email, 'user_inactive', ip_address)
            return jsonify({'error': 'Hesap devre dışı'}), 401
        
        # Şifre kontrolü
        if not SecurityUtils.verify_password(password, user.password_hash):
            security_logger.log_failed_authentication(email, 'invalid_password', ip_address)
            return jsonify({'error': 'Geçersiz şifre'}), 401
        
        # Token oluştur
        access_token = SecurityUtils.generate_token(user.to_dict())
        refresh_token = SecurityUtils.generate_refresh_token(user.id)
        
        # Son giriş zamanını güncelle
        user.last_login = datetime.now(timezone.utc)
        user.save()
        
        # Başarılı girişi logla
        security_logger.log_login_attempt(email, True, ip_address, user_agent)
        app_logger.log_business_event('user_login', {'user_id': user.id}, user.id)
        
        return jsonify({
            'message': 'Giriş başarılı',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': 3600  # 1 hour
        }), 200
        
    except Exception as e:
        app_logger.log_error('login_error', str(e), request_data=request.json)
        return jsonify({'error': 'Giriş işlemi sırasında hata oluştu'}), 500

@auth_bp.route('/register', methods=['POST'])
@rate_limit(limit=3, window=600)  # 3 attempts per 10 minutes
def register():
    """Kullanıcı kaydı"""
    try:
        # Request validation
        validation_rules = {
            'name': {'required': True, 'type': 'string', 'min_length': 2, 'max_length': 255},
            'email': {'required': True, 'type': 'email'},
            'password': {'required': True, 'type': 'string', 'min_length': 8},
            'phone': {'required': False, 'type': 'string', 'max_length': 20},
            'role_id': {'required': False, 'type': 'string', 'default': '4'}  # Default: Customer
        }
        
        data, errors = validate_request_data(request.json, validation_rules)
        if errors:
            return jsonify({'error': 'Geçersiz veri', 'details': errors}), 400
        
        # Email formatını kontrol et
        if not SecurityUtils.validate_email(data['email']):
            return jsonify({'error': 'Geçersiz email formatı'}), 400
        
        # Şifre gücünü kontrol et
        password_validation = SecurityUtils.validate_password_strength(data['password'])
        if not password_validation['is_valid']:
            return jsonify({
                'error': 'Şifre gereksinimleri karşılanmıyor',
                'details': password_validation['errors']
            }), 400
        
        # Email zaten kayıtlı mı kontrol et
        existing_user = User.get_by_email(data['email'])
        if existing_user:
            return jsonify({'error': 'Bu email adresi zaten kayıtlı'}), 409
        
        # Şifreyi hashle
        password_hash = SecurityUtils.hash_password(data['password'])
        
        # Yeni kullanıcı oluştur
        new_user = User(
            id=str(uuid.uuid4()),
            name=data['name'],
            email=data['email'],
            password_hash=password_hash,
            role_id=data['role_id'],
            phone=data.get('phone'),
            is_active=True,
            email_verified=False
        )
        
        new_user.save()
        
        # Başarılı kaydı logla
        app_logger.log_business_event('user_registration', {
            'user_id': new_user.id,
            'email': new_user.email,
            'role_id': new_user.role_id
        })
        
        return jsonify({
            'message': 'Kayıt başarılı',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        app_logger.log_error('registration_error', str(e), request_data=request.json)
        return jsonify({'error': 'Kayıt işlemi sırasında hata oluştu'}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
@rate_limit(limit=3, window=900)  # 3 attempts per 15 minutes
def forgot_password():
    """Şifremi unuttum"""
    try:
        data = request.json
        email = data.get('email')
        
        if not email or not SecurityUtils.validate_email(email):
            return jsonify({'error': 'Geçerli bir email adresi gerekli'}), 400
        
        user = User.get_by_email(email)
        if not user:
            # Güvenlik için her zaman başarılı mesajı döndür
            return jsonify({'message': 'Şifre sıfırlama bağlantısı email adresinize gönderildi'}), 200
        
        # Mevcut token'ları pasifleştir
        PasswordReset.query.filter_by(email=email, used=False).update({'used': True})
        db.session.commit()
        
        # Yeni token oluştur
        reset_token = SecurityUtils.generate_password_reset_token(email)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        password_reset = PasswordReset(
            id=str(uuid.uuid4()),
            email=email,
            token=reset_token,
            expires_at=expires_at
        )
        password_reset.save()
        
        # Email gönderme işlemi
        from utils.email_service import email_service
        email_sent = email_service.send_password_reset_email(
            email=email, 
            reset_token=reset_token,
            user_name=user.name
        )
        
        if not email_sent:
            app_logger.log_warning('password_reset_email_failed', 
                                 f'Failed to send password reset email to {email}')
        
        app_logger.log_business_event('password_reset_requested', {
            'email': email,
            'token_id': password_reset.id
        })
        
        return jsonify({'message': 'Şifre sıfırlama bağlantısı email adresinize gönderildi'}), 200
        
    except Exception as e:
        app_logger.log_error('forgot_password_error', str(e), request_data=request.json)
        return jsonify({'error': 'Şifre sıfırlama işlemi sırasında hata oluştu'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
@rate_limit(limit=5, window=900)  # 5 attempts per 15 minutes
def reset_password():
    """Şifre sıfırlama"""
    try:
        data = request.json
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token ve yeni şifre gerekli'}), 400
        
        # Şifre gücünü kontrol et
        password_validation = SecurityUtils.validate_password_strength(new_password)
        if not password_validation['is_valid']:
            return jsonify({
                'error': 'Şifre gereksinimleri karşılanmıyor',
                'details': password_validation['errors']
            }), 400
        
        # Token'ı kontrol et
        reset_request = PasswordReset.get_valid_token(token)
        if not reset_request:
            return jsonify({'error': 'Geçersiz veya süresi dolmuş token'}), 400
        
        # Kullanıcıyı bul
        user = User.get_by_email(reset_request.email)
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
        
        # Şifreyi güncelle
        user.password_hash = SecurityUtils.hash_password(new_password)
        user.save()
        
        # Token'ı kullanılmış olarak işaretle
        reset_request.used = True
        reset_request.save()
        
        app_logger.log_business_event('password_reset_completed', {
            'user_id': user.id,
            'email': user.email
        })
        
        return jsonify({'message': 'Şifre başarıyla güncellendi'}), 200
        
    except Exception as e:
        app_logger.log_error('reset_password_error', str(e), request_data=request.json)
        return jsonify({'error': 'Şifre sıfırlama işlemi sırasında hata oluştu'}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Token yenileme"""
    try:
        data = request.json
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({'error': 'Refresh token gerekli'}), 400
        
        # Refresh token'ı doğrula
        payload = SecurityUtils.verify_token(refresh_token)
        if not payload or payload.get('type') != 'refresh':
            return jsonify({'error': 'Geçersiz refresh token'}), 401
        
        # Kullanıcıyı kontrol et
        user = User.get_by_id(payload['user_id'])
        if not user or not user.is_active:
            return jsonify({'error': 'Kullanıcı bulunamadı veya aktif değil'}), 401
        
        # Yeni access token oluştur
        new_access_token = SecurityUtils.generate_token(user.to_dict())
        
        return jsonify({
            'access_token': new_access_token,
            'expires_in': 3600
        }), 200
        
    except Exception as e:
        app_logger.log_error('refresh_token_error', str(e), request_data=request.json)
        return jsonify({'error': 'Token yenileme işlemi sırasında hata oluştu'}), 500

@auth_bp.route('/validate', methods=['GET'])
def validate_token():
    """Token doğrulama"""
    try:
        token = None
        
        # Bearer token kontrolü
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'valid': False, 'error': 'Geçersiz authorization header'}), 401
        
        if not token:
            return jsonify({'valid': False, 'error': 'Token gerekli'}), 401
        
        # Token'ı doğrula
        payload = SecurityUtils.verify_token(token)
        if not payload:
            return jsonify({'valid': False, 'error': 'Geçersiz token'}), 401
        
        # Kullanıcıyı kontrol et
        user = User.get_by_id(payload['user_id'])
        if not user or not user.is_active:
            return jsonify({'valid': False, 'error': 'Kullanıcı aktif değil'}), 401
        
        return jsonify({
            'valid': True,
            'user': user.to_dict(),
            'expires_at': payload['exp']
        }), 200
        
    except Exception as e:
        app_logger.log_error('validate_token_error', str(e))
        return jsonify({'valid': False, 'error': 'Token doğrulama hatası'}), 500 