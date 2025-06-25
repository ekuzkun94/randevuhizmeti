from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from models.models import db, Business, UserBusiness, User, Provider
from utils.validators import validate_required_fields
from utils.logger import log_request, log_error
import json
import uuid

businesses_bp = Blueprint('businesses', __name__)

@businesses_bp.route('/businesses', methods=['GET'])
@jwt_required()
@log_request
def get_businesses():
    """Kullanıcının erişebildiği işletmeleri listele"""
    try:
        current_user_id = get_jwt_identity()
        
        # Kullanıcının bağlı olduğu işletmeleri getir
        user_businesses = UserBusiness.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).all()
        
        result = []
        for ub in user_businesses:
            business = Business.query.get(ub.business_id)
            if business and business.is_active:
                business_dict = business.to_dict()
                business_dict['user_role'] = ub.role
                business_dict['permissions'] = json.loads(ub.permissions) if ub.permissions else {}
                business_dict['joined_at'] = ub.joined_at.isoformat() if ub.joined_at else None
                
                # İşletme istatistikleri
                providers_count = Provider.query.filter_by(business_id=business.id).count()
                business_dict['providers_count'] = providers_count
                
                result.append(business_dict)
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        log_error(f"Businesses list error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İşletmeler listelenirken hata oluştu'
        }), 500

@businesses_bp.route('/businesses', methods=['POST'])
@jwt_required()
@log_request
def create_business():
    """Yeni işletme oluştur"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Zorunlu alanları kontrol et
        required_fields = ['name', 'business_type']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return validation_error
        
        # Yeni işletme oluştur
        business = Business(
            id=str(uuid.uuid4()),
            name=data['name'],
            description=data.get('description'),
            owner_id=current_user_id,
            business_type=data['business_type'],
            address=data.get('address'),
            city=data.get('city'),
            phone=data.get('phone'),
            email=data.get('email'),
            website=data.get('website'),
            timezone=data.get('timezone', 'Europe/Istanbul'),
            currency=data.get('currency', 'TRY'),
            language=data.get('language', 'tr_TR'),
            subscription_type=data.get('subscription_type', 'free'),
            max_providers=data.get('max_providers', 1),
            max_customers=data.get('max_customers', 100)
        )
        
        business.save()
        
        # Kullanıcıyı işletme sahibi olarak ekle
        user_business = UserBusiness(
            id=str(uuid.uuid4()),
            user_id=current_user_id,
            business_id=business.id,
            role='owner',
            permissions=json.dumps({
                'admin': True,
                'manage_providers': True,
                'manage_services': True,
                'manage_appointments': True,
                'view_analytics': True
            })
        )
        
        user_business.save()
        
        return jsonify({
            'success': True,
            'message': 'İşletme başarıyla oluşturuldu',
            'data': business.to_dict()
        }), 201
        
    except Exception as e:
        log_error(f"Business creation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İşletme oluşturulurken hata oluştu'
        }), 500

@businesses_bp.route('/businesses/<business_id>', methods=['PUT'])
@jwt_required()
@log_request
def update_business(business_id):
    """İşletme bilgilerini güncelle"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # İşletmeyi bul ve yetki kontrol et
        user_business = UserBusiness.query.filter_by(
            user_id=current_user_id,
            business_id=business_id,
            is_active=True
        ).first()
        
        if not user_business or user_business.role not in ['owner', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Bu işletmeyi güncelleme yetkiniz yok'
            }), 403
        
        business = Business.query.get(business_id)
        if not business:
            return jsonify({
                'success': False,
                'message': 'İşletme bulunamadı'
            }), 404
        
        # Güncellenebilir alanları kontrol et
        updatable_fields = [
            'name', 'description', 'business_type', 'address', 'city',
            'phone', 'email', 'website', 'timezone', 'currency', 'language'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(business, field, data[field])
        
        business.save()
        
        return jsonify({
            'success': True,
            'message': 'İşletme başarıyla güncellendi',
            'data': business.to_dict()
        }), 200
        
    except Exception as e:
        log_error(f"Business update error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İşletme güncellenirken hata oluştu'
        }), 500

@businesses_bp.route('/businesses/<business_id>/users', methods=['GET'])
@jwt_required()
@log_request
def get_business_users(business_id):
    """İşletme kullanıcılarını listele"""
    try:
        current_user_id = get_jwt_identity()
        
        # Yetki kontrol et
        user_business = UserBusiness.query.filter_by(
            user_id=current_user_id,
            business_id=business_id,
            is_active=True
        ).first()
        
        if not user_business:
            return jsonify({
                'success': False,
                'message': 'Bu işletmeye erişim yetkiniz yok'
            }), 403
        
        # İşletme kullanıcılarını getir
        business_users = UserBusiness.query.filter_by(
            business_id=business_id,
            is_active=True
        ).all()
        
        result = []
        for bu in business_users:
            user = User.query.get(bu.user_id)
            if user:
                user_dict = {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'role': bu.role,
                    'permissions': json.loads(bu.permissions) if bu.permissions else {},
                    'joined_at': bu.joined_at.isoformat() if bu.joined_at else None,
                    'is_active': bu.is_active
                }
                result.append(user_dict)
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        log_error(f"Business users list error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İşletme kullanıcıları listelenirken hata oluştu'
        }), 500

@businesses_bp.route('/businesses/<business_id>/users', methods=['POST'])
@jwt_required()
@log_request
def invite_user_to_business(business_id):
    """İşletmeye kullanıcı davet et"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Yetki kontrol et
        user_business = UserBusiness.query.filter_by(
            user_id=current_user_id,
            business_id=business_id,
            is_active=True
        ).first()
        
        if not user_business or user_business.role not in ['owner', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Kullanıcı davet etme yetkiniz yok'
            }), 403
        
        # Zorunlu alanları kontrol et
        required_fields = ['email', 'role']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return validation_error
        
        # Kullanıcıyı bul
        user = User.query.filter_by(email=data['email']).first()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Bu email adresine sahip kullanıcı bulunamadı'
            }), 404
        
        # Zaten üye mi kontrol et
        existing = UserBusiness.query.filter_by(
            user_id=user.id,
            business_id=business_id
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'message': 'Kullanıcı zaten bu işletmenin üyesi'
            }), 400
        
        # Yeni üyelik oluştur
        new_user_business = UserBusiness(
            id=str(uuid.uuid4()),
            user_id=user.id,
            business_id=business_id,
            role=data['role'],
            permissions=json.dumps(data.get('permissions', {}))
        )
        
        new_user_business.save()
        
        return jsonify({
            'success': True,
            'message': 'Kullanıcı başarıyla işletmeye eklendi',
            'data': {
                'user_id': user.id,
                'name': user.name,
                'email': user.email,
                'role': data['role']
            }
        }), 201
        
    except Exception as e:
        log_error(f"User invitation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Kullanıcı davet edilirken hata oluştu'
        }), 500

@businesses_bp.route('/businesses/<business_id>/statistics', methods=['GET'])
@jwt_required()
@log_request
def get_business_statistics(business_id):
    """İşletme istatistiklerini getir"""
    try:
        current_user_id = get_jwt_identity()
        
        # Yetki kontrol et
        user_business = UserBusiness.query.filter_by(
            user_id=current_user_id,
            business_id=business_id,
            is_active=True
        ).first()
        
        if not user_business:
            return jsonify({
                'success': False,
                'message': 'Bu işletmeye erişim yetkiniz yok'
            }), 403
        
        business = Business.query.get(business_id)
        if not business:
            return jsonify({
                'success': False,
                'message': 'İşletme bulunamadı'
            }), 404
        
        # İstatistikleri hesapla
        providers_count = Provider.query.filter_by(business_id=business_id).count()
        users_count = UserBusiness.query.filter_by(business_id=business_id, is_active=True).count()
        
        statistics = {
            'business_info': {
                'name': business.name,
                'business_type': business.business_type,
                'subscription_type': business.subscription_type,
                'created_at': business.created_at.isoformat()
            },
            'users': {
                'total_users': users_count,
                'max_customers': business.max_customers,
                'usage_percentage': (users_count / business.max_customers) * 100 if business.max_customers > 0 else 0
            },
            'providers': {
                'total_providers': providers_count,
                'max_providers': business.max_providers,
                'usage_percentage': (providers_count / business.max_providers) * 100 if business.max_providers > 0 else 0
            }
        }
        
        return jsonify({
            'success': True,
            'data': statistics
        }), 200
        
    except Exception as e:
        log_error(f"Business statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İşletme istatistikleri alınırken hata oluştu'
        }), 500
