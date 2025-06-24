#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import uuid

from models.models import db, Provider, User, Service, WorkingHour
from utils.security import require_auth, require_role, rate_limit
from utils.logger import app_logger
from utils.validators import validate_request_data, PROVIDER_VALIDATION_RULES, WORKING_HOURS_VALIDATION_RULES

providers_bp = Blueprint('providers', __name__, url_prefix='/providers')

@providers_bp.route('', methods=['GET'])
@rate_limit(limit=100, window=300)  # 100 requests per 5 minutes
def get_providers():
    """Provider listesi"""
    try:
        # Query parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        city = request.args.get('city')
        specialization = request.args.get('specialization')
        verified_only = request.args.get('verified_only', 'false').lower() == 'true'
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        search = request.args.get('search')
        
        query = Provider.query.join(User)
        
        # Filters
        if active_only:
            query = query.filter(Provider.is_active == True)
        
        if verified_only:
            query = query.filter(Provider.is_verified == True)
        
        if city:
            query = query.filter(Provider.city.ilike(f'%{city}%'))
        
        if specialization:
            query = query.filter(Provider.specialization.ilike(f'%{specialization}%'))
        
        if search:
            query = query.filter(
                db.or_(
                    Provider.business_name.ilike(f'%{search}%'),
                    Provider.specialization.ilike(f'%{search}%'),
                    Provider.description.ilike(f'%{search}%'),
                    User.name.ilike(f'%{search}%')
                )
            )
        
        # Pagination
        providers = query.order_by(
            Provider.rating.desc(),
            Provider.total_reviews.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Enrich data
        provider_list = []
        for provider in providers.items:
            provider_data = provider.to_dict()
            
            # Add user info
            user = User.query.get(provider.user_id)
            if user:
                provider_data['name'] = user.name
                provider_data['email'] = user.email
            
            # Add service count
            service_count = Service.query.filter_by(
                provider_id=provider.id,
                is_active=True
            ).count()
            provider_data['service_count'] = service_count
            
            # Add sample services
            sample_services = Service.query.filter_by(
                provider_id=provider.id,
                is_active=True
            ).limit(3).all()
            provider_data['sample_services'] = [s.to_dict() for s in sample_services]
            
            provider_list.append(provider_data)
        
        app_logger.log_api_request('GET', '/providers', status_code=200)
        
        return jsonify({
            'providers': provider_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': providers.total,
                'pages': providers.pages,
                'has_next': providers.has_next,
                'has_prev': providers.has_prev
            }
        }), 200
        
    except Exception as e:
        app_logger.log_error('get_providers_error', str(e))
        return jsonify({'error': 'Sağlayıcılar yüklenirken hata oluştu'}), 500

@providers_bp.route('/<provider_id>', methods=['GET'])
def get_provider(provider_id):
    """Provider detayı"""
    try:
        provider = Provider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
        
        # Only show active providers to public
        if not provider.is_active:
            # Check if user is authorized to see inactive providers
            auth_header = request.headers.get('Authorization')
            if auth_header:
                try:
                    from utils.security import SecurityUtils
                    token = auth_header.split(' ')[1]
                    payload = SecurityUtils.verify_token(token)
                    if payload:
                        user_role = payload.get('role_id')
                        if user_role in ['1', '2']:  # Admin, Manager
                            pass  # Can see inactive providers
                        elif user_role == '3':  # Provider
                            if provider.user_id != payload['user_id']:
                                return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
                        else:
                            return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
                    else:
                        return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
                except:
                    return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
            else:
                return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
        
        provider_data = provider.to_dict()
        
        # Add user info
        user = User.query.get(provider.user_id)
        if user:
            provider_data['name'] = user.name
            provider_data['email'] = user.email
            provider_data['user_info'] = user.to_dict()
        
        # Add services
        services = Service.query.filter_by(
            provider_id=provider_id,
            is_active=True
        ).all()
        provider_data['services'] = [s.to_dict() for s in services]
        
        # Add working hours
        working_hours = WorkingHour.query.filter_by(
            provider_id=provider_id
        ).order_by(WorkingHour.day_of_week).all()
        provider_data['working_hours'] = [wh.to_dict() for wh in working_hours]
        
        # Add statistics
        from models.models import Appointment
        total_appointments = Appointment.query.filter_by(
            provider_id=provider_id
        ).count()
        
        completed_appointments = Appointment.query.filter_by(
            provider_id=provider_id,
            status='completed'
        ).count()
        
        provider_data['statistics'] = {
            'total_appointments': total_appointments,
            'completed_appointments': completed_appointments,
            'service_count': len(services),
            'completion_rate': round((completed_appointments / total_appointments * 100) if total_appointments > 0 else 0, 1)
        }
        
        return jsonify({'provider': provider_data}), 200
        
    except Exception as e:
        app_logger.log_error('get_provider_error', str(e))
        return jsonify({'error': 'Sağlayıcı detayı yüklenirken hata oluştu'}), 500

@providers_bp.route('/<provider_id>', methods=['PUT'])
@require_auth
def update_provider(provider_id):
    """Provider profili güncelle"""
    try:
        user_id = request.current_user.get('user_id')
        user_role = request.current_user.get('role_id')
        
        provider = Provider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
        
        # Authorization kontrolü
        can_update = False
        if user_role in ['1', '2']:  # Admin, Manager
            can_update = True
        elif user_role == '3':  # Provider
            if provider.user_id == user_id:
                can_update = True
        
        if not can_update:
            return jsonify({'error': 'Bu profili güncelleme yetkiniz yok'}), 403
        
        # Request validation
        data = request.json or {}
        allowed_fields = ['business_name', 'description', 'specialization', 'experience_years', 
                         'phone', 'address', 'city']
        
        # Admin can update additional fields
        if user_role in ['1', '2']:
            allowed_fields.extend(['is_verified', 'is_active'])
        
        # Validate updated fields
        update_rules = {}
        for field in allowed_fields:
            if field in data:
                if field in PROVIDER_VALIDATION_RULES:
                    update_rules[field] = PROVIDER_VALIDATION_RULES[field]
        
        if update_rules:
            validated_data, errors = validate_request_data(
                {k: v for k, v in data.items() if k in update_rules}, 
                update_rules
            )
            if errors:
                return jsonify({'error': 'Geçersiz veri', 'details': errors}), 400
        
        # Update fields
        updated_fields = []
        for field in allowed_fields:
            if field in data:
                setattr(provider, field, data[field])
                updated_fields.append(field)
        
        if updated_fields:
            provider.updated_at = datetime.now(timezone.utc)
            provider.save()
            
            app_logger.log_business_event('provider_updated', {
                'provider_id': provider_id,
                'updated_fields': updated_fields,
                'updated_by': user_id
            }, user_id)
            
            return jsonify({
                'message': 'Profil başarıyla güncellendi',
                'provider': provider.to_dict(),
                'updated_fields': updated_fields
            }), 200
        else:
            return jsonify({'message': 'Güncellenecek alan bulunamadı'}), 400
        
    except Exception as e:
        app_logger.log_error('update_provider_error', str(e), user_id=request.current_user.get('user_id'))
        return jsonify({'error': 'Profil güncellenirken hata oluştu'}), 500

@providers_bp.route('/<provider_id>/working-hours', methods=['GET'])
def get_working_hours(provider_id):
    """Provider çalışma saatleri"""
    try:
        provider = Provider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
        
        working_hours = WorkingHour.query.filter_by(
            provider_id=provider_id
        ).order_by(WorkingHour.day_of_week).all()
        
        # Organize by day
        days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
        organized_hours = {}
        
        for wh in working_hours:
            day_name = days[wh.day_of_week]
            if day_name not in organized_hours:
                organized_hours[day_name] = []
            
            organized_hours[day_name].append(wh.to_dict())
        
        return jsonify({
            'provider_id': provider_id,
            'working_hours': organized_hours
        }), 200
        
    except Exception as e:
        app_logger.log_error('get_working_hours_error', str(e))
        return jsonify({'error': 'Çalışma saatleri yüklenirken hata oluştu'}), 500

@providers_bp.route('/<provider_id>/working-hours', methods=['POST'])
@require_auth
@require_role(['1', '2', '3'])  # Admin, Manager, Provider
def create_working_hours(provider_id):
    """Çalışma saatleri oluştur"""
    try:
        user_id = request.current_user.get('user_id')
        user_role = request.current_user.get('role_id')
        
        provider = Provider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
        
        # Authorization kontrolü
        if user_role == '3':  # Provider
            if provider.user_id != user_id:
                return jsonify({'error': 'Bu çalışma saatlerini oluşturma yetkiniz yok'}), 403
        
        # Request validation
        data = request.json or {}
        validation_rules = WORKING_HOURS_VALIDATION_RULES.copy()
        validation_rules['provider_id']['default'] = provider_id
        
        validated_data, errors = validate_request_data(data, validation_rules)
        if errors:
            return jsonify({'error': 'Geçersiz veri', 'details': errors}), 400
        
        # Check for existing working hours
        existing = WorkingHour.query.filter_by(
            provider_id=provider_id,
            day_of_week=validated_data['day_of_week'],
            start_time=validated_data['start_time']
        ).first()
        
        if existing:
            return jsonify({'error': 'Bu zaman dilimi için zaten çalışma saati tanımlanmış'}), 409
        
        # Create working hours
        working_hour = WorkingHour(
            id=str(uuid.uuid4()),
            provider_id=provider_id,
            day_of_week=validated_data['day_of_week'],
            start_time=validated_data['start_time'],
            end_time=validated_data['end_time'],
            is_available=validated_data.get('is_available', True)
        )
        
        working_hour.save()
        
        app_logger.log_business_event('working_hours_created', {
            'provider_id': provider_id,
            'day_of_week': validated_data['day_of_week'],
            'start_time': validated_data['start_time'],
            'end_time': validated_data['end_time']
        }, user_id)
        
        return jsonify({
            'message': 'Çalışma saatleri başarıyla oluşturuldu',
            'working_hour': working_hour.to_dict()
        }), 201
        
    except Exception as e:
        app_logger.log_error('create_working_hours_error', str(e), user_id=request.current_user.get('user_id'))
        return jsonify({'error': 'Çalışma saatleri oluşturulurken hata oluştu'}), 500

@providers_bp.route('/search', methods=['GET'])
@rate_limit(limit=50, window=300)  # 50 searches per 5 minutes
def search_providers():
    """Provider arama"""
    try:
        query_text = request.args.get('q', '').strip()
        if not query_text or len(query_text) < 2:
            return jsonify({'error': 'En az 2 karakter arama yapmalısınız'}), 400
        
        city = request.args.get('city')
        specialization = request.args.get('specialization')
        verified_only = request.args.get('verified_only', 'false').lower() == 'true'
        
        # Base query
        query = Provider.query.join(User).filter(
            Provider.is_active == True
        )
        
        # Text search
        query = query.filter(
            db.or_(
                Provider.business_name.ilike(f'%{query_text}%'),
                Provider.specialization.ilike(f'%{query_text}%'),
                Provider.description.ilike(f'%{query_text}%'),
                User.name.ilike(f'%{query_text}%')
            )
        )
        
        # Filters
        if city:
            query = query.filter(Provider.city.ilike(f'%{city}%'))
        
        if specialization:
            query = query.filter(Provider.specialization.ilike(f'%{specialization}%'))
        
        if verified_only:
            query = query.filter(Provider.is_verified == True)
        
        # Execute query
        providers = query.order_by(
            Provider.rating.desc(),
            Provider.total_reviews.desc()
        ).limit(50).all()
        
        # Format results
        results = []
        for provider in providers:
            provider_data = provider.to_dict()
            user = User.query.get(provider.user_id)
            if user:
                provider_data['name'] = user.name
            
            # Add service count
            service_count = Service.query.filter_by(
                provider_id=provider.id,
                is_active=True
            ).count()
            provider_data['service_count'] = service_count
            
            results.append(provider_data)
        
        app_logger.log_business_event('provider_search', {
            'query': query_text,
            'results_count': len(results),
            'filters': {
                'city': city,
                'specialization': specialization,
                'verified_only': verified_only
            }
        })
        
        return jsonify({
            'query': query_text,
            'results': results,
            'count': len(results)
        }), 200
        
    except Exception as e:
        app_logger.log_error('search_providers_error', str(e))
        return jsonify({'error': 'Arama yapılırken hata oluştu'}), 500

@providers_bp.route('/cities', methods=['GET'])
def get_cities():
    """Provider şehirleri"""
    try:
        cities = db.session.query(Provider.city).filter(
            Provider.city.isnot(None),
            Provider.city != '',
            Provider.is_active == True
        ).distinct().all()
        
        city_list = [city[0] for city in cities if city[0]]
        
        return jsonify({
            'cities': sorted(city_list)
        }), 200
        
    except Exception as e:
        app_logger.log_error('get_cities_error', str(e))
        return jsonify({'error': 'Şehirler yüklenirken hata oluştu'}), 500

@providers_bp.route('/specializations', methods=['GET'])
def get_specializations():
    """Provider uzmanlık alanları"""
    try:
        specializations = db.session.query(Provider.specialization).filter(
            Provider.specialization.isnot(None),
            Provider.specialization != '',
            Provider.is_active == True
        ).distinct().all()
        
        specialization_list = [spec[0] for spec in specializations if spec[0]]
        
        return jsonify({
            'specializations': sorted(specialization_list)
        }), 200
        
    except Exception as e:
        app_logger.log_error('get_specializations_error', str(e))
        return jsonify({'error': 'Uzmanlık alanları yüklenirken hata oluştu'}), 500 