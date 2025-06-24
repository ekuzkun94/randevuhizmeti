#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import uuid

from models.models import db, Appointment, User, Provider, Service
from utils.security import require_auth, require_role, rate_limit
from utils.logger import app_logger
from utils.validators import validate_request_data, APPOINTMENT_VALIDATION_RULES

appointments_bp = Blueprint('appointments', __name__, url_prefix='/appointments')

@appointments_bp.route('', methods=['GET'])
@require_auth
@rate_limit(limit=50, window=300)  # 50 requests per 5 minutes
def get_appointments():
    """Randevu listesi - role bazlı filtreleme ile"""
    try:
        user_id = request.current_user.get('user_id')
        user_role = request.current_user.get('role_id')
        
        query = Appointment.query
        
        # Role bazlı filtreleme
        if user_role == '4':  # Customer
            query = query.filter_by(customer_id=user_id)
        elif user_role == '3':  # Provider
            # Provider'ın kendi randevuları
            provider = Provider.query.filter_by(user_id=user_id).first()
            if provider:
                query = query.filter_by(provider_id=provider.id)
            else:
                return jsonify({'appointments': [], 'total': 0}), 200
        # Admin ve Manager tüm randevuları görebilir
        
        # Query parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        status = request.args.get('status')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Filters
        if status:
            query = query.filter_by(status=status)
        if date_from:
            query = query.filter(Appointment.appointment_date >= date_from)
        if date_to:
            query = query.filter(Appointment.appointment_date <= date_to)
        
        # Pagination
        appointments = query.order_by(
            Appointment.appointment_date.desc(), 
            Appointment.appointment_time.desc()
        ).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Enrich data
        appointment_list = []
        for appointment in appointments.items:
            appointment_data = appointment.to_dict()
            
            # Add related data
            if appointment.customer_id:
                customer = User.query.get(appointment.customer_id)
                appointment_data['customer_name'] = customer.name if customer else appointment.customer_name
            
            provider = Provider.query.get(appointment.provider_id)
            if provider:
                provider_user = User.query.get(provider.user_id)
                appointment_data['provider_name'] = provider_user.name if provider_user else None
                appointment_data['provider_business'] = provider.business_name
            
            service = Service.query.get(appointment.service_id)
            appointment_data['service_name'] = service.name if service else None
            appointment_data['service_duration'] = service.duration if service else None
            
            appointment_list.append(appointment_data)
        
        app_logger.log_api_request('GET', '/appointments', user_id, 200)
        
        return jsonify({
            'appointments': appointment_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': appointments.total,
                'pages': appointments.pages,
                'has_next': appointments.has_next,
                'has_prev': appointments.has_prev
            }
        }), 200
        
    except Exception as e:
        app_logger.log_error('get_appointments_error', str(e), user_id=request.current_user.get('user_id'))
        return jsonify({'error': 'Randevular yüklenirken hata oluştu'}), 500

@appointments_bp.route('', methods=['POST'])
@rate_limit(limit=10, window=600)  # 10 appointments per 10 minutes
def create_appointment():
    """Yeni randevu oluştur"""
    try:
        # Request validation
        data, errors = validate_request_data(request.json, APPOINTMENT_VALIDATION_RULES)
        if errors:
            return jsonify({'error': 'Geçersiz veri', 'details': errors}), 400
        
        # Provider ve service kontrolü
        provider = Provider.query.get(data['provider_id'])
        if not provider or not provider.is_active:
            return jsonify({'error': 'Geçersiz veya aktif olmayan sağlayıcı'}), 400
        
        service = Service.query.get(data['service_id'])
        if not service or not service.is_active or service.provider_id != data['provider_id']:
            return jsonify({'error': 'Geçersiz hizmet'}), 400
        
        # Çakışma kontrolü
        existing_appointment = Appointment.query.filter_by(
            provider_id=data['provider_id'],
            appointment_date=data['appointment_date'],
            appointment_time=data['appointment_time'],
            status='confirmed'
        ).first()
        
        if existing_appointment:
            return jsonify({'error': 'Bu saat için zaten randevu bulunmaktadır'}), 409
        
        # Authentication kontrolü
        user_id = None
        if 'Authorization' in request.headers:
            # Authenticated user
            auth_header = request.headers['Authorization']
            try:
                from utils.security import SecurityUtils
                token = auth_header.split(' ')[1]
                payload = SecurityUtils.verify_token(token)
                if payload:
                    user_id = payload['user_id']
                    user = User.query.get(user_id)
                    if user:
                        data['customer_id'] = user_id
                        data['customer_name'] = user.name
                        data['customer_email'] = user.email
                        data['is_guest'] = False
            except:
                pass
        
        if not user_id:
            # Guest appointment
            data['is_guest'] = True
            data['customer_id'] = None
        
        # Yeni randevu oluştur
        new_appointment = Appointment(
            id=str(uuid.uuid4()),
            customer_id=data.get('customer_id'),
            customer_name=data['customer_name'],
            customer_email=data['customer_email'],
            customer_phone=data.get('customer_phone'),
            provider_id=data['provider_id'],
            service_id=data['service_id'],
            appointment_date=datetime.strptime(data['appointment_date'], '%Y-%m-%d').date(),
            appointment_time=data['appointment_time'],
            notes=data.get('notes', ''),
            status='pending',
            is_guest=data.get('is_guest', False),
            duration=service.duration,
            price=service.price
        )
        
        new_appointment.save()
        
        # Log business event
        app_logger.log_business_event('appointment_created', {
            'appointment_id': new_appointment.id,
            'provider_id': data['provider_id'],
            'service_id': data['service_id'],
            'is_guest': data.get('is_guest', False)
        }, user_id)
        
        app_logger.log_database_operation('CREATE', 'appointments', new_appointment.id, user_id)
        
        return jsonify({
            'message': 'Randevu başarıyla oluşturuldu',
            'appointment': new_appointment.to_dict()
        }), 201
        
    except Exception as e:
        app_logger.log_error('create_appointment_error', str(e), request_data=request.json)
        return jsonify({'error': 'Randevu oluşturulurken hata oluştu'}), 500

@appointments_bp.route('/<appointment_id>', methods=['GET'])
@require_auth
def get_appointment(appointment_id):
    """Randevu detayı"""
    try:
        user_id = request.current_user.get('user_id')
        user_role = request.current_user.get('role_id')
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Randevu bulunamadı'}), 404
        
        # Authorization kontrolü
        if user_role == '4':  # Customer
            if appointment.customer_id != user_id:
                return jsonify({'error': 'Bu randevuya erişim yetkiniz yok'}), 403
        elif user_role == '3':  # Provider
            provider = Provider.query.filter_by(user_id=user_id).first()
            if not provider or appointment.provider_id != provider.id:
                return jsonify({'error': 'Bu randevuya erişim yetkiniz yok'}), 403
        
        # Enrich data
        appointment_data = appointment.to_dict()
        
        # Add related information
        if appointment.customer_id:
            customer = User.query.get(appointment.customer_id)
            appointment_data['customer_info'] = customer.to_dict() if customer else None
        
        provider = Provider.query.get(appointment.provider_id)
        if provider:
            provider_user = User.query.get(provider.user_id)
            appointment_data['provider_info'] = {
                'id': provider.id,
                'name': provider_user.name if provider_user else None,
                'business_name': provider.business_name,
                'phone': provider.phone,
                'specialization': provider.specialization
            }
        
        service = Service.query.get(appointment.service_id)
        if service:
            appointment_data['service_info'] = service.to_dict()
        
        return jsonify({'appointment': appointment_data}), 200
        
    except Exception as e:
        app_logger.log_error('get_appointment_error', str(e), user_id=request.current_user.get('user_id'))
        return jsonify({'error': 'Randevu detayı yüklenirken hata oluştu'}), 500

@appointments_bp.route('/<appointment_id>', methods=['PUT'])
@require_auth
def update_appointment(appointment_id):
    """Randevu güncelle"""
    try:
        user_id = request.current_user.get('user_id')
        user_role = request.current_user.get('role_id')
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Randevu bulunamadı'}), 404
        
        # Authorization kontrolü
        can_update = False
        if user_role in ['1', '2']:  # Admin, Manager
            can_update = True
        elif user_role == '3':  # Provider
            provider = Provider.query.filter_by(user_id=user_id).first()
            if provider and appointment.provider_id == provider.id:
                can_update = True
        elif user_role == '4':  # Customer
            if appointment.customer_id == user_id:
                can_update = True
        
        if not can_update:
            return jsonify({'error': 'Bu randevuyu güncelleme yetkiniz yok'}), 403
        
        # Partial validation for updates
        data = request.json or {}
        allowed_fields = ['appointment_date', 'appointment_time', 'notes', 'status']
        
        if user_role == '4':  # Customer can only update limited fields
            allowed_fields = ['appointment_date', 'appointment_time', 'notes']
        
        # Update fields
        updated_fields = []
        for field in allowed_fields:
            if field in data:
                if field == 'appointment_date':
                    try:
                        appointment.appointment_date = datetime.strptime(data[field], '%Y-%m-%d').date()
                        updated_fields.append(field)
                    except ValueError:
                        return jsonify({'error': 'Geçersiz tarih formatı'}), 400
                elif field == 'status':
                    valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
                    if data[field] in valid_statuses:
                        appointment.status = data[field]
                        updated_fields.append(field)
                    else:
                        return jsonify({'error': 'Geçersiz durum'}), 400
                else:
                    setattr(appointment, field, data[field])
                    updated_fields.append(field)
        
        if updated_fields:
            appointment.updated_at = datetime.now(timezone.utc)
            appointment.save()
            
            app_logger.log_business_event('appointment_updated', {
                'appointment_id': appointment_id,
                'updated_fields': updated_fields,
                'user_role': user_role
            }, user_id)
            
            return jsonify({
                'message': 'Randevu başarıyla güncellendi',
                'appointment': appointment.to_dict(),
                'updated_fields': updated_fields
            }), 200
        else:
            return jsonify({'message': 'Güncellenecek alan bulunamadı'}), 400
        
    except Exception as e:
        app_logger.log_error('update_appointment_error', str(e), user_id=request.current_user.get('user_id'))
        return jsonify({'error': 'Randevu güncellenirken hata oluştu'}), 500

@appointments_bp.route('/<appointment_id>', methods=['DELETE'])
@require_auth
@require_role(['1', '2', '3'])  # Admin, Manager, Provider only
def delete_appointment(appointment_id):
    """Randevu sil"""
    try:
        user_id = request.current_user.get('user_id')
        user_role = request.current_user.get('role_id')
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Randevu bulunamadı'}), 404
        
        # Provider authorization
        if user_role == '3':  # Provider
            provider = Provider.query.filter_by(user_id=user_id).first()
            if not provider or appointment.provider_id != provider.id:
                return jsonify({'error': 'Bu randevuyu silme yetkiniz yok'}), 403
        
        # Soft delete (status change)
        appointment.status = 'cancelled'
        appointment.updated_at = datetime.now(timezone.utc)
        appointment.save()
        
        app_logger.log_business_event('appointment_cancelled', {
            'appointment_id': appointment_id,
            'cancelled_by': user_id
        }, user_id)
        
        return jsonify({'message': 'Randevu başarıyla iptal edildi'}), 200
        
    except Exception as e:
        app_logger.log_error('delete_appointment_error', str(e), user_id=request.current_user.get('user_id'))
        return jsonify({'error': 'Randevu silinirken hata oluştu'}), 500

@appointments_bp.route('/available-slots', methods=['GET'])
def get_available_slots():
    """Müsait randevu saatleri"""
    try:
        provider_id = request.args.get('provider_id')
        service_id = request.args.get('service_id')
        date = request.args.get('date')
        
        if not all([provider_id, service_id, date]):
            return jsonify({'error': 'provider_id, service_id ve date parametreleri gerekli'}), 400
        
        # Provider ve service kontrolü
        provider = Provider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Sağlayıcı bulunamadı'}), 404
        
        service = Service.query.get(service_id)
        if not service or service.provider_id != provider_id:
            return jsonify({'error': 'Geçersiz hizmet'}), 404
        
        # O gün için var olan randevuları al
        existing_appointments = Appointment.query.filter_by(
            provider_id=provider_id,
            appointment_date=date,
            status='confirmed'
        ).all()
        
        booked_times = [apt.appointment_time for apt in existing_appointments]
        
        # Çalışma saatlerini al (basit versiyon - 09:00-18:00)
        available_slots = []
        start_hour = 9
        end_hour = 18
        
        for hour in range(start_hour, end_hour):
            for minute in [0, 30]:  # 30 dakika aralıklarla
                time_slot = f"{hour:02d}:{minute:02d}"
                if time_slot not in booked_times:
                    available_slots.append({
                        'time': time_slot,
                        'available': True
                    })
        
        return jsonify({
            'date': date,
            'provider_id': provider_id,
            'service_id': service_id,
            'available_slots': available_slots
        }), 200
        
    except Exception as e:
        app_logger.log_error('get_available_slots_error', str(e))
        return jsonify({'error': 'Müsait saatler yüklenirken hata oluştu'}), 500 