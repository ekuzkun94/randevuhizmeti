from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
# from ai_helper import AIHelper  # Geçici olarak devre dışı
from dotenv import load_dotenv
from flask_cors import CORS
import os
import hashlib
import uuid
import pymysql
import qrcode
import io
import base64
import random
import string
from sqlalchemy import func

# PyMySQL kullanımı için
pymysql.install_as_MySQLdb()

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # CORS desteği eklendi

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@{os.getenv('MYSQL_HOST')}/appointment_system"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
# ai_helper = AIHelper()  # Geçici olarak devre dışı

# Ana sayfa route'u
@app.route('/', methods=['GET'])
def home():
    try:
        return jsonify({
            'status': 'success',
            'message': 'Randevu API çalışıyor',
            'endpoints': {
                'POST /auth/login': 'Kullanıcı girişi',
                'GET /appointments': 'Tüm randevuları listele',
                'POST /appointments': 'Yeni randevu oluştur',
                'PUT /appointments/<id>': 'Randevu güncelle',
                'DELETE /appointments/<id>': 'Randevu sil',
                'GET /services': 'Tüm hizmetleri listele',
                'GET /services/provider/<provider_id>': 'Belirli provider\'ın hizmetleri',
                'POST /services': 'Yeni hizmet oluştur',
                'PUT /services/<id>': 'Hizmet güncelle',
                'DELETE /services/<id>': 'Hizmet sil',
                'GET /working-hours/<provider_id>': 'Provider\'ın çalışma saatleri',
                'POST /working-hours': 'Çalışma saatleri oluştur',
                'PUT /working-hours/<provider_id>': 'Çalışma saatleri güncelle',
                'GET /providers': 'Tüm provider\'ları listele',
                'GET /providers/<provider_id>': 'Belirli provider bilgileri',
                'PUT /providers/<provider_id>': 'Provider profili güncelle'
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Model tanımlamaları
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.String(36), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role_id': self.role_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Service(db.Model):
    __tablename__ = 'services'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    duration = db.Column(db.Integer, default=60)  # Dakika cinsinden
    price = db.Column(db.Numeric(10, 2), default=0.00)
    provider_id = db.Column(db.String(36), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'duration': self.duration,
            'price': float(self.price) if self.price else 0.0,
            'provider_id': self.provider_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class WorkingHour(db.Model):
    __tablename__ = 'working_hours'
    
    id = db.Column(db.String(36), primary_key=True)
    provider_id = db.Column(db.String(36), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    start_time = db.Column(db.String(10), nullable=False)  # HH:MM formatında
    end_time = db.Column(db.String(10), nullable=False)  # HH:MM formatında
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'provider_id': self.provider_id,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Provider(db.Model):
    __tablename__ = 'providers'
    
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), nullable=False)
    business_name = db.Column(db.String(255))
    description = db.Column(db.Text)
    specialization = db.Column(db.String(255))
    experience_years = db.Column(db.Integer, default=0)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    rating = db.Column(db.Numeric(3, 2), default=0.00)
    total_reviews = db.Column(db.Integer, default=0)
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_name': self.business_name,
            'description': self.description,
            'specialization': self.specialization,
            'experience_years': self.experience_years,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'rating': float(self.rating) if self.rating else 0.0,
            'total_reviews': self.total_reviews,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.String(36), primary_key=True)
    customer_id = db.Column(db.String(36))
    customer_name = db.Column(db.String(255))
    customer_email = db.Column(db.String(255))
    customer_phone = db.Column(db.String(20))
    provider_id = db.Column(db.String(36), nullable=False)
    service_id = db.Column(db.String(36), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.String(10), nullable=False)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')
    is_guest = db.Column(db.Boolean, default=False)
    duration = db.Column(db.Integer)
    location = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2))
    payment_status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'provider_id': self.provider_id,
            'service_id': self.service_id,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'appointment_time': self.appointment_time,
            'notes': self.notes,
            'status': self.status,
            'is_guest': self.is_guest,
            'duration': self.duration,
            'location': self.location,
            'price': float(self.price) if self.price else 0.0,
            'payment_status': self.payment_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Staff(db.Model):
    __tablename__ = 'staff'
    
    id = db.Column(db.String(36), primary_key=True)
    provider_id = db.Column(db.String(36), nullable=False)
    user_id = db.Column(db.String(36), nullable=False)  # Reference to User table
    position = db.Column(db.String(100))  # Pozisyon: Doktor, Hemşire, Asistan vb.
    department = db.Column(db.String(100))  # Bölüm
    hire_date = db.Column(db.Date)
    salary = db.Column(db.Numeric(10, 2))
    is_active = db.Column(db.Boolean, default=True)
    permissions = db.Column(db.Text)  # JSON format permissions
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'provider_id': self.provider_id,
            'user_id': self.user_id,
            'position': self.position,
            'department': self.department,
            'hire_date': self.hire_date.isoformat() if self.hire_date else None,
            'salary': float(self.salary) if self.salary else 0.0,
            'is_active': self.is_active,
            'permissions': self.permissions,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Shift(db.Model):
    __tablename__ = 'shifts'
    
    id = db.Column(db.String(36), primary_key=True)
    staff_id = db.Column(db.String(36), nullable=False)
    shift_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(10), nullable=False)  # HH:MM
    end_time = db.Column(db.String(10), nullable=False)    # HH:MM
    shift_type = db.Column(db.String(20), default='regular')  # regular, overtime, holiday
    status = db.Column(db.String(20), default='scheduled')  # scheduled, started, completed, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'shift_date': self.shift_date.isoformat() if self.shift_date else None,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'shift_type': self.shift_type,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class PasswordReset(db.Model):
    __tablename__ = 'password_resets'
    
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    token = db.Column(db.String(100), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'token': self.token,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'used': self.used,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class QRCode(db.Model):
    __tablename__ = 'qr_codes'
    
    id = db.Column(db.String(36), primary_key=True)
    appointment_id = db.Column(db.String(36), nullable=False)
    qr_code_data = db.Column(db.Text, nullable=False)  # Base64 encoded QR code
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'appointment_id': self.appointment_id,
            'qr_code_data': self.qr_code_data,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'used': self.used,
            'used_at': self.used_at.isoformat() if self.used_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Auth Routes
@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        role_id = data.get('role_id')  # Opsiyonel - frontend'den gönderilen role_id
        
        if not email or not password:
            return jsonify({'error': 'Email ve şifre gerekli'}), 400
        
        # Kullanıcıyı veritabanından bul
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 401
        
        # Şifre kontrolü (basit string karşılaştırması - gerçek uygulamada hash kullanılmalı)
        if user.password != password:
            return jsonify({'error': 'Geçersiz şifre'}), 401
        
        # Role kontrolü (eğer role_id belirtilmişse)
        if role_id and user.role_id != role_id:
            return jsonify({'error': 'Bu role ile giriş yetkiniz yok'}), 403
        
        # Başarılı giriş
        return jsonify({
            'message': 'Giriş başarılı',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Giriş hatası: {str(e)}'}), 500

# API Routes
@app.route('/appointments', methods=['GET'])
def get_appointments():
    try:
        appointments = Appointment.query.all()
        appointment_list = []
        
        for appointment in appointments:
            # Provider ve service bilgilerini al
            provider = User.query.get(appointment.provider_id)
            service = Service.query.get(appointment.service_id)
            
            appointment_data = appointment.to_dict()
            # Ek bilgileri ekle
            appointment_data['provider_name'] = provider.name if provider else None
            appointment_data['service_name'] = service.name if service else None
            
            appointment_list.append(appointment_data)
        
        return jsonify({
            'appointments': appointment_list,
            'total': len(appointment_list)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/appointments', methods=['POST'])
def create_appointment():
    try:
        data = request.json
        
        # Yeni randevu oluştur
        new_appointment = Appointment(
            id=str(uuid.uuid4()),
            customer_id=data.get('customer_id'),
            customer_name=data.get('customer_name', ''),
            customer_email=data.get('customer_email'),
            customer_phone=data.get('customer_phone'),
            provider_id=data.get('provider_id', ''),
            service_id=data.get('service_id', ''),
            appointment_date=datetime.strptime(data.get('appointment_date'), '%Y-%m-%d').date() if data.get('appointment_date') else None,
            appointment_time=data.get('appointment_time', ''),
            notes=data.get('notes', ''),
            status=data.get('status', 'pending'),
            is_guest=data.get('is_guest', False),
            duration=data.get('duration'),
            location=data.get('location', ''),
            price=data.get('price', 0),
            payment_status=data.get('payment_status', 'pending')
        )
        
        db.session.add(new_appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Randevu başarıyla oluşturuldu',
            'appointment': new_appointment.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Services Routes
@app.route('/services', methods=['GET'])
def get_services():
    try:
        services = Service.query.all()
        service_list = [service.to_dict() for service in services]
        
        return jsonify({
            'services': service_list,
            'total': len(service_list)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/services/provider/<provider_id>', methods=['GET'])
def get_services_by_provider(provider_id):
    try:
        services = Service.query.filter_by(provider_id=provider_id).all()
        service_list = [service.to_dict() for service in services]
        
        return jsonify({
            'services': service_list,
            'total': len(service_list)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/services', methods=['POST'])
def create_service():
    try:
        data = request.json
        
        new_service = Service(
            id=str(uuid.uuid4()),
            name=data.get('name', ''),
            description=data.get('description', ''),
            duration=data.get('duration', 60),
            price=data.get('price', 0.0),
            provider_id=data.get('provider_id', '')
        )
        
        db.session.add(new_service)
        db.session.commit()
        
        return jsonify({
            'message': 'Hizmet başarıyla oluşturuldu',
            'service': new_service.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/services/<service_id>', methods=['PUT'])
def update_service(service_id):
    try:
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Hizmet bulunamadı'}), 404
        
        data = request.json
        
        if 'name' in data:
            service.name = data['name']
        if 'description' in data:
            service.description = data['description']
        if 'duration' in data:
            service.duration = data['duration']
        if 'price' in data:
            service.price = data['price']
            
        service.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Hizmet başarıyla güncellendi',
            'service': service.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/services/<service_id>', methods=['DELETE'])
def delete_service(service_id):
    try:
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Hizmet bulunamadı'}), 404
        
        db.session.delete(service)
        db.session.commit()
        
        return jsonify({'message': 'Hizmet başarıyla silindi'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Working Hours Routes
@app.route('/working-hours/<provider_id>', methods=['GET'])
def get_working_hours(provider_id):
    try:
        working_hours = WorkingHour.query.filter_by(provider_id=provider_id).order_by(WorkingHour.day_of_week).all()
        hours_list = [hour.to_dict() for hour in working_hours]
        
        return jsonify({
            'working_hours': hours_list,
            'total': len(hours_list)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/working-hours', methods=['POST'])
def create_working_hours():
    try:
        data = request.json
        
        new_working_hour = WorkingHour(
            id=str(uuid.uuid4()),
            provider_id=data.get('provider_id', ''),
            day_of_week=data.get('day_of_week', 0),
            start_time=data.get('start_time', '09:00'),
            end_time=data.get('end_time', '17:00'),
            is_available=data.get('is_available', True)
        )
        
        db.session.add(new_working_hour)
        db.session.commit()
        
        return jsonify({
            'message': 'Çalışma saati başarıyla oluşturuldu',
            'working_hour': new_working_hour.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/working-hours/<provider_id>', methods=['PUT'])
def update_working_hours(provider_id):
    try:
        data = request.json
        working_hours_data = data.get('working_hours', [])
        
        # Mevcut çalışma saatlerini sil
        WorkingHour.query.filter_by(provider_id=provider_id).delete()
        
        # Yeni çalışma saatlerini ekle
        for hour_data in working_hours_data:
            new_working_hour = WorkingHour(
                id=str(uuid.uuid4()),
                provider_id=provider_id,
                day_of_week=hour_data.get('day_of_week', 0),
                start_time=hour_data.get('start_time', '09:00'),
                end_time=hour_data.get('end_time', '17:00'),
                is_available=hour_data.get('is_available', True)
            )
            db.session.add(new_working_hour)
        
        db.session.commit()
        
        # Güncellenmiş çalışma saatlerini getir
        updated_hours = WorkingHour.query.filter_by(provider_id=provider_id).order_by(WorkingHour.day_of_week).all()
        hours_list = [hour.to_dict() for hour in updated_hours]
        
        return jsonify({
            'message': 'Çalışma saatleri başarıyla güncellendi',
            'working_hours': hours_list
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Providers Routes
@app.route('/providers', methods=['GET'])
def get_providers():
    try:
        providers = Provider.query.filter_by(is_active=True).all()
        provider_list = []
        
        for provider in providers:
            provider_data = provider.to_dict()
            # User bilgisini ekle
            user = User.query.get(provider.user_id)
            provider_data['user_name'] = user.name if user else None
            provider_data['user_email'] = user.email if user else None
            provider_list.append(provider_data)
        
        return jsonify({
            'providers': provider_list,
            'total': len(provider_list)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/providers/<provider_id>', methods=['GET'])
def get_provider(provider_id):
    try:
        provider = Provider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Provider bulunamadı'}), 404
        
        provider_data = provider.to_dict()
        # User bilgisini ekle
        user = User.query.get(provider.user_id)
        provider_data['user_name'] = user.name if user else None
        provider_data['user_email'] = user.email if user else None
        
        return jsonify({'provider': provider_data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/providers/<provider_id>', methods=['PUT'])
def update_provider(provider_id):
    try:
        provider = Provider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Provider bulunamadı'}), 404
        
        data = request.json
        
        if 'business_name' in data:
            provider.business_name = data['business_name']
        if 'description' in data:
            provider.description = data['description']
        if 'specialization' in data:
            provider.specialization = data['specialization']
        if 'experience_years' in data:
            provider.experience_years = data['experience_years']
        if 'phone' in data:
            provider.phone = data['phone']
        if 'address' in data:
            provider.address = data['address']
        if 'city' in data:
            provider.city = data['city']
        if 'is_active' in data:
            provider.is_active = data['is_active']
            
        provider.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Provider profili başarıyla güncellendi',
            'provider': provider.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/appointments/<appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Randevu bulunamadı'}), 404
        
        data = request.json
        
        # Güncelleme yapılabilir alanlar
        if 'status' in data:
            appointment.status = data['status']
        if 'appointment_date' in data:
            appointment.appointment_date = datetime.strptime(data.get('appointment_date'), '%Y-%m-%d').date()
        if 'appointment_time' in data:
            appointment.appointment_time = data['appointment_time']
        if 'notes' in data:
            appointment.notes = data['notes']
        if 'location' in data:
            appointment.location = data['location']
        if 'price' in data:
            appointment.price = data['price']
        if 'payment_status' in data:
            appointment.payment_status = data['payment_status']
        
        appointment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Randevu başarıyla güncellendi',
            'appointment': appointment.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/appointments/<appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Randevu bulunamadı'}), 404
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({'message': 'Randevu başarıyla silindi'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        try:
            # Mevcut tabloları kontrol et ve sadece gerekli olanları oluştur
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            if not existing_tables:
                db.create_all()
                print("Database tables created successfully")
            else:
                print("Database tables already exist, verifying schema...")
                # Sadece eksik tabloları oluştur
                db.create_all()
                print("Database tables verified successfully")
        except Exception as e:
            print(f"Database initialization completed with note: {str(e)}")
    app.run(host='0.0.0.0', debug=True, port=5001) 