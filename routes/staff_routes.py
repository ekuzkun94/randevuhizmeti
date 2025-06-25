#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import uuid

from models.models import db, User
from utils.security import SecurityUtils, require_role, rate_limit
from utils.logger import app_logger
from utils.validators import validate_request_data

staff_bp = Blueprint('staff', __name__)

@staff_bp.route('/staff', methods=['GET'])
@require_role(['1', '2'])  # Admin and Manager roles
def get_staff():
    """Tüm personeli getir - basit implementasyon"""
    try:
        # Şimdilik sadece kullanıcıları döndür
        users = User.query.filter(User.role_id.in_(['2', '3'])).all()  # Manager and Provider roles
        
        staff_list = []
        for user in users:
            staff_list.append({
                'id': user.id,
                'user_id': user.id,
                'user_name': user.name,
                'user_email': user.email,
                'position': 'Personel',
                'department': 'Genel',
                'salary': None,
                'is_active': user.is_active
            })
        
        return jsonify({'staff': staff_list}), 200
        
    except Exception as e:
        app_logger.log_error('get_staff_error', str(e))
        return jsonify({'error': 'Personel listesi alınırken hata oluştu'}), 500

@staff_bp.route('/shifts', methods=['GET'])
@require_role(['1', '2'])  # Admin and Manager roles
def get_shifts():
    """Vardiyaları getir - mock data"""
    try:
        # Mock vardiya verisi
        shift_list = [
            {
                'id': 'shift1',
                'user_id': 'user1',
                'staff_name': 'Örnek Personel',
                'shift_date': '2024-01-15',
                'start_time': '09:00',
                'end_time': '17:00',
                'shift_type': 'regular',
                'status': 'scheduled',
                'notes': None
            }
        ]
        
        return jsonify({'shifts': shift_list}), 200
        
    except Exception as e:
        app_logger.log_error('get_shifts_error', str(e))
        return jsonify({'error': 'Vardiya listesi alınırken hata oluştu'}), 500

@staff_bp.route('/staff', methods=['POST'])
@require_role(['1', '2'])  # Admin and Manager roles
@rate_limit(limit=10, window=300)
def create_staff():
    """Yeni personel ekle"""
    try:
        validation_rules = {
            'user_name': {'required': True, 'type': 'string', 'min_length': 2},
            'user_email': {'required': True, 'type': 'email'},
            'position': {'required': False, 'type': 'string'},
            'department': {'required': False, 'type': 'string'},
            'salary': {'required': False, 'type': 'number'}
        }
        
        data, errors = validate_request_data(request.json, validation_rules)
        if errors:
            return jsonify({'error': 'Geçersiz veri', 'details': errors}), 400
        
        # Önce kullanıcı oluştur
        user_id = str(uuid.uuid4())
        password_hash = SecurityUtils.hash_password('changeme123')
        
        new_user = User(
            id=user_id,
            name=data['user_name'],
            email=data['user_email'],
            password_hash=password_hash,
            role_id='3',  # Provider role
            is_active=True,
            email_verified=False
        )
        
        new_user.save()
        
        return jsonify({
            'message': 'Personel başarıyla eklendi',
            'staff': {
                'id': user_id,
                'user_name': data['user_name'],
                'user_email': data['user_email'],
                'temp_password': 'changeme123'
            }
        }), 201
        
    except Exception as e:
        app_logger.log_error('create_staff_error', str(e))
        return jsonify({'error': 'Personel oluşturulurken hata oluştu'}), 500

@staff_bp.route('/staff/<staff_id>', methods=['PUT'])
@require_role(['1', '2'])  # Admin and Manager roles
def update_staff(staff_id):
    """Personel güncelle"""
    try:
        user = User.query.get(staff_id)
        if not user:
            return jsonify({'error': 'Personel bulunamadı'}), 404
        
        data = request.json or {}
        
        if data.get('user_name'):
            user.name = data['user_name']
        if data.get('user_email'):
            user.email = data['user_email']
        
        user.save()
        
        return jsonify({'message': 'Personel başarıyla güncellendi'}), 200
        
    except Exception as e:
        app_logger.log_error('update_staff_error', str(e))
        return jsonify({'error': 'Personel güncellenirken hata oluştu'}), 500

@staff_bp.route('/staff/<staff_id>', methods=['DELETE'])
@require_role(['1', '2'])  # Admin and Manager roles
def delete_staff(staff_id):
    """Personel sil"""
    try:
        user = User.query.get(staff_id)
        if not user:
            return jsonify({'error': 'Personel bulunamadı'}), 404
        
        user.is_active = False
        user.save()
        
        return jsonify({'message': 'Personel başarıyla silindi'}), 200
        
    except Exception as e:
        app_logger.log_error('delete_staff_error', str(e))
        return jsonify({'error': 'Personel silinirken hata oluştu'}), 500

@staff_bp.route('/shifts', methods=['POST'])
@require_role(['1', '2'])  # Admin and Manager roles
@rate_limit(limit=20, window=300)
def create_shift():
    """Yeni vardiya oluştur"""
    try:
        # Mock implementation - gerçek veritabanı olmadığı için
        return jsonify({
            'message': 'Vardiya başarıyla oluşturuldu',
            'shift': {
                'id': str(uuid.uuid4()),
                'status': 'scheduled'
            }
        }), 201
        
    except Exception as e:
        app_logger.log_error('create_shift_error', str(e))
        return jsonify({'error': 'Vardiya oluşturulurken hata oluştu'}), 500

@staff_bp.route('/shifts/<shift_id>', methods=['PUT'])
@require_role(['1', '2'])  # Admin and Manager roles
def update_shift(shift_id):
    """Vardiya güncelle"""
    try:
        # Mock implementation
        return jsonify({'message': 'Vardiya başarıyla güncellendi'}), 200
        
    except Exception as e:
        app_logger.log_error('update_shift_error', str(e))
        return jsonify({'error': 'Vardiya güncellenirken hata oluştu'}), 500 