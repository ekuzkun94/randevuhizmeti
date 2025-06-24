#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import uuid

from models.models import db, Service, Provider, User
from utils.security import require_auth, require_role, rate_limit
from utils.logger import app_logger
from utils.validators import validate_request_data, SERVICE_VALIDATION_RULES

services_bp = Blueprint('services', __name__, url_prefix='/services')

@services_bp.route('', methods=['GET'])
@rate_limit(limit=100, window=300)  # 100 requests per 5 minutes
def get_services():
    """Hizmet listesi"""
    try:
        # Query parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        provider_id = request.args.get('provider_id')
        category = request.args.get('category')
        search = request.args.get('search')
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        query = Service.query
        
        # Filters
        if active_only:
            query = query.filter_by(is_active=True)
        
        if provider_id:
            query = query.filter_by(provider_id=provider_id)
        
        if category:
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                db.or_(
                    Service.name.ilike(f'%{search}%'),
                    Service.description.ilike(f'%{search}%')
                )
            )
        
        # Pagination
        services = query.order_by(Service.name).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Enrich data
        service_list = []
        for service in services.items:
            service_data = service.to_dict()
            
            # Add provider info
            provider = Provider.query.get(service.provider_id)
            if provider:
                provider_user = User.query.get(provider.user_id)
                service_data['provider_info'] = {
                    'id': provider.id,
                    'name': provider_user.name if provider_user else None,
                    'business_name': provider.business_name,
                    'rating': float(provider.rating) if provider.rating else 0.0,
                    'city': provider.city
                }
            
            service_list.append(service_data)
        
        app_logger.log_api_request('GET', '/services', status_code=200)
        
        return jsonify({
            'services': service_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': services.total,
                'pages': services.pages,
                'has_next': services.has_next,
                'has_prev': services.has_prev
            }
        }), 200
        
    except Exception as e:
        app_logger.log_error('get_services_error', str(e))
        return jsonify({'error': 'Hizmetler yüklenirken hata oluştu'}), 500

@services_bp.route('', methods=['POST'])
@require_auth
@require_role(['1', '2', '3'])  # Admin, Manager, Provider
@rate_limit(limit=20, window=3600)  # 20 services per hour
def create_service():
    """Yeni hizmet oluştur"""
    try:
        user_id = request.current_user.get('user_id')
        user_role = request.current_user.get('role_id')
        
        # Request validation
        data, errors = validate_request_data(request.json, SERVICE_VALIDATION_RULES)
        if errors:
            return jsonify({'error': 'Geçersiz veri', 'details': errors}), 400
        
        # Provider authorization
        if user_role == '3':  # Provider
            provider = Provider.query.filter_by(user_id=user_id).first()
            if not provider:
                return jsonify({'error': 'Provider profili bulunamadı'}), 404
            
            # Provider can only create services for themselves
            if data['provider_id'] != provider.id:
                return jsonify({'error': 'Sadece kendi hizmetlerinizi oluşturabilirsiniz'}), 403
        else:
            # Admin/Manager can create for any provider
            provider = Provider.query.get(data['provider_id'])
            if not provider:
                return jsonify({'error': 'Geçersiz provider'}), 400
        
        # Create new service
        new_service = Service(
            id=str(uuid.uuid4()),
            name=data['name'],
            description=data.get('description', ''),
            duration=data['duration'],
            price=data['price'],
            provider_id=data['provider_id'],
            category=data.get('category', ''),
            is_active=data.get('is_active', True)
        )
        
        new_service.save()
        
        app_logger.log_business_event('service_created', {
            'service_id': new_service.id,
            'provider_id': data['provider_id'],
            'name': data['name'],
            'price': data['price']
        }, user_id)
        
        app_logger.log_database_operation('CREATE', 'services', new_service.id, user_id)
        
        return jsonify({
            'message': 'Hizmet başarıyla oluşturuldu',
            'service': new_service.to_dict()
        }), 201
        
    except Exception as e:
        app_logger.log_error('create_service_error', str(e), user_id=request.current_user.get('user_id'))
        return jsonify({'error': 'Hizmet oluşturulurken hata oluştu'}), 500

@services_bp.route('/<service_id>', methods=['GET'])
def get_service(service_id):
    """Hizmet detayı"""
    try:
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Hizmet bulunamadı'}), 404
        
        # Only show active services to public
        if not service.is_active:
            # Check if user is authorized to see inactive services
            auth_header = request.headers.get('Authorization')
            if auth_header:
                try:
                    from utils.security import SecurityUtils
                    token = auth_header.split(' ')[1]
                    payload = SecurityUtils.verify_token(token)
                    if payload:
                        user_role = payload.get('role_id')
                        if user_role in ['1', '2']:  # Admin, Manager
                            pass  # Can see inactive services
                        elif user_role == '3':  # Provider
                            provider = Provider.query.filter_by(user_id=payload['user_id']).first()
                            if not provider or service.provider_id != provider.id:
                                return jsonify({'error': 'Hizmet bulunamadı'}), 404
                        else:
                            return jsonify({'error': 'Hizmet bulunamadı'}), 404
                    else:
                        return jsonify({'error': 'Hizmet bulunamadı'}), 404
                except:
                    return jsonify({'error': 'Hizmet bulunamadı'}), 404
            else:
                return jsonify({'error': 'Hizmet bulunamadı'}), 404
        
        service_data = service.to_dict()
        
        # Add provider info
        provider = Provider.query.get(service.provider_id)
        if provider:
            provider_user = User.query.get(provider.user_id)
            service_data['provider_info'] = {
                'id': provider.id,
                'name': provider_user.name if provider_user else None,
                'business_name': provider.business_name,
                'description': provider.description,
                'specialization': provider.specialization,
                'experience_years': provider.experience_years,
                'rating': float(provider.rating) if provider.rating else 0.0,
                'total_reviews': provider.total_reviews,
                'phone': provider.phone,
                'address': provider.address,
                'city': provider.city,
                'is_verified': provider.is_verified
            }
        
        return jsonify({'service': service_data}), 200
        
    except Exception as e:
        app_logger.log_error('get_service_error', str(e))
        return jsonify({'error': 'Hizmet detayı yüklenirken hata oluştu'}), 500

@services_bp.route('/<service_id>', methods=['PUT'])
@require_auth
@require_role(['1', '2', '3'])  # Admin, Manager, Provider
def update_service(service_id):
    """Hizmet güncelle"""
    try:
        user_id = request.current_user.get('user_id')
        user_role = request.current_user.get('role_id')
        
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Hizmet bulunamadı'}), 404
        
        # Authorization kontrolü
        if user_role == '3':  # Provider
            provider = Provider.query.filter_by(user_id=user_id).first()
            if not provider or service.provider_id != provider.id:
                return jsonify({'error': 'Bu hizmeti güncelleme yetkiniz yok'}), 403
        
        # Partial validation for updates
        data = request.json or {}
        allowed_fields = ['name', 'description', 'duration', 'price', 'category', 'is_active']
        
        if user_role == '3':  # Provider cannot change some fields
            allowed_fields = ['name', 'description', 'duration', 'price', 'category']
        
        # Validate updated fields
        update_rules = {}
        for field in allowed_fields:
            if field in data:
                if field in SERVICE_VALIDATION_RULES:
                    update_rules[field] = SERVICE_VALIDATION_RULES[field]
        
        if update_rules:
            validated_data, errors = validate_request_data({k: v for k, v in data.items() if k in update_rules}, update_rules)
            if errors:
                return jsonify({'error': 'Geçersiz veri', 'details': errors}), 400
        
        # Update fields
        updated_fields = []
        for field in allowed_fields:
            if field in data:
                setattr(service, field, data[field])
                updated_fields.append(field)
        
        if updated_fields:
            service.updated_at = datetime.now(timezone.utc)
            service.save()
            
            app_logger.log_business_event('service_updated', {
                'service_id': service_id,
                'updated_fields': updated_fields
            }, user_id)
            
            return jsonify({
                'message': 'Hizmet başarıyla güncellendi',
                'service': service.to_dict(),
                'updated_fields': updated_fields
            }), 200
        else:
            return jsonify({'message': 'Güncellenecek alan bulunamadı'}), 400
        
    except Exception as e:
        app_logger.log_error('update_service_error', str(e), user_id=request.current_user.get('user_id'))
        return jsonify({'error': 'Hizmet güncellenirken hata oluştu'}), 500

@services_bp.route('/<service_id>', methods=['DELETE'])
@require_auth
@require_role(['1', '2', '3'])  # Admin, Manager, Provider
def delete_service(service_id):
    """Hizmet sil (soft delete)"""
    try:
        user_id = request.current_user.get('user_id')
        user_role = request.current_user.get('role_id')
        
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Hizmet bulunamadı'}), 404
        
        # Authorization kontrolü
        if user_role == '3':  # Provider
            provider = Provider.query.filter_by(user_id=user_id).first()
            if not provider or service.provider_id != provider.id:
                return jsonify({'error': 'Bu hizmeti silme yetkiniz yok'}), 403
        
        # Check for active appointments
        from models.models import Appointment
        active_appointments = Appointment.query.filter_by(
            service_id=service_id,
            status='confirmed'
        ).filter(
            Appointment.appointment_date >= datetime.now().date()
        ).count()
        
        if active_appointments > 0:
            return jsonify({
                'error': 'Bu hizmet için aktif randevular bulunmaktadır. Önce randevuları iptal edin.'
            }), 409
        
        # Soft delete
        service.is_active = False
        service.updated_at = datetime.now(timezone.utc)
        service.save()
        
        app_logger.log_business_event('service_deleted', {
            'service_id': service_id,
            'name': service.name
        }, user_id)
        
        return jsonify({'message': 'Hizmet başarıyla silindi'}), 200
        
    except Exception as e:
        app_logger.log_error('delete_service_error', str(e), user_id=request.current_user.get('user_id'))
        return jsonify({'error': 'Hizmet silinirken hata oluştu'}), 500

@services_bp.route('/categories', methods=['GET'])
def get_service_categories():
    """Hizmet kategorileri"""
    try:
        categories = db.session.query(Service.category).filter(
            Service.category.isnot(None),
            Service.category != '',
            Service.is_active == True
        ).distinct().all()
        
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return jsonify({
            'categories': sorted(category_list)
        }), 200
        
    except Exception as e:
        app_logger.log_error('get_categories_error', str(e))
        return jsonify({'error': 'Kategoriler yüklenirken hata oluştu'}), 500

@services_bp.route('/search', methods=['GET'])
@rate_limit(limit=50, window=300)  # 50 searches per 5 minutes
def search_services():
    """Hizmet arama"""
    try:
        query_text = request.args.get('q', '').strip()
        if not query_text or len(query_text) < 2:
            return jsonify({'error': 'En az 2 karakter arama yapmalısınız'}), 400
        
        city = request.args.get('city')
        category = request.args.get('category')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        
        # Base query
        query = db.session.query(Service).join(Provider).join(User).filter(
            Service.is_active == True,
            Provider.is_active == True
        )
        
        # Text search
        query = query.filter(
            db.or_(
                Service.name.ilike(f'%{query_text}%'),
                Service.description.ilike(f'%{query_text}%'),
                Provider.business_name.ilike(f'%{query_text}%'),
                Provider.specialization.ilike(f'%{query_text}%')
            )
        )
        
        # Filters
        if city:
            query = query.filter(Provider.city.ilike(f'%{city}%'))
        
        if category:
            query = query.filter(Service.category == category)
        
        if min_price is not None:
            query = query.filter(Service.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Service.price <= max_price)
        
        # Execute query
        services = query.order_by(
            Provider.rating.desc(),
            Service.price.asc()
        ).limit(50).all()
        
        # Format results
        results = []
        for service in services:
            service_data = service.to_dict()
            provider = Provider.query.get(service.provider_id)
            if provider:
                provider_user = User.query.get(provider.user_id)
                service_data['provider_info'] = {
                    'name': provider_user.name if provider_user else None,
                    'business_name': provider.business_name,
                    'city': provider.city,
                    'rating': float(provider.rating) if provider.rating else 0.0
                }
            results.append(service_data)
        
        app_logger.log_business_event('service_search', {
            'query': query_text,
            'results_count': len(results),
            'filters': {
                'city': city,
                'category': category,
                'min_price': min_price,
                'max_price': max_price
            }
        })
        
        return jsonify({
            'query': query_text,
            'results': results,
            'count': len(results)
        }), 200
        
    except Exception as e:
        app_logger.log_error('search_services_error', str(e))
        return jsonify({'error': 'Arama yapılırken hata oluştu'}), 500 