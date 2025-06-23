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
                'POST /auth/forgot-password': 'Şifremi unuttum',
                'POST /auth/reset-password': 'Şifre sıfırlama',
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
                'PUT /providers/<provider_id>': 'Provider profili güncelle',
                'GET /dashboard/analytics': 'Dashboard istatistikleri',
                'POST /qr/generate/<appointment_id>': 'QR kod oluştur',
                'POST /qr/checkin': 'QR kod ile check-in',
                'GET /staff': 'Personel listesi',
                'POST /staff': 'Yeni personel ekle',
                'GET /shifts': 'Vardiya listesi',
                'POST /shifts': 'Yeni vardiya oluştur'
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

# ==================== NEW FEATURES ====================

# Dashboard Analytics Routes
@app.route('/dashboard/analytics', methods=['GET'])
def get_dashboard_analytics():
    try:
        # Bugünkü tarih
        today = datetime.now().date()
        
        # Toplam istatistikler
        total_appointments = Appointment.query.count()
        total_customers = User.query.filter_by(role_id='3').count()
        total_providers = Provider.query.filter_by(is_active=True).count()
        total_services = Service.query.count()
        
        # Bugünkü randevular
        today_appointments = Appointment.query.filter_by(appointment_date=today).count()
        
        # Bu ayki randevular
        first_day_of_month = today.replace(day=1)
        monthly_appointments = Appointment.query.filter(
            Appointment.appointment_date >= first_day_of_month
        ).count()
        
        # Status dağılımı
        status_stats = db.session.query(
            Appointment.status,
            func.count(Appointment.id)
        ).group_by(Appointment.status).all()
        
        # Son 7 günün randevu trendi
        appointment_trend = []
        for i in range(7):
            date = today - timedelta(days=i)
            count = Appointment.query.filter_by(appointment_date=date).count()
            appointment_trend.append({
                'date': date.isoformat(),
                'count': count
            })
        
        # Gelir istatistikleri
        total_revenue = db.session.query(func.sum(Appointment.price)).filter(
            Appointment.payment_status == 'paid'
        ).scalar() or 0
        
        monthly_revenue = db.session.query(func.sum(Appointment.price)).filter(
            Appointment.appointment_date >= first_day_of_month,
            Appointment.payment_status == 'paid'
        ).scalar() or 0
        
        return jsonify({
            'totals': {
                'appointments': total_appointments,
                'customers': total_customers,
                'providers': total_providers,
                'services': total_services
            },
            'today': {
                'appointments': today_appointments
            },
            'monthly': {
                'appointments': monthly_appointments,
                'revenue': float(monthly_revenue)
            },
            'status_distribution': [{'status': s[0], 'count': s[1]} for s in status_stats],
            'appointment_trend': appointment_trend,
            'revenue': {
                'total': float(total_revenue),
                'monthly': float(monthly_revenue)
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# QR Code Routes
@app.route('/qr/generate/<appointment_id>', methods=['POST'])
def generate_qr_code(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Randevu bulunamadı'}), 404
        
        # QR kod verisi oluştur
        qr_data = {
            'appointment_id': appointment_id,
            'customer_name': appointment.customer_name,
            'appointment_date': appointment.appointment_date.isoformat(),
            'appointment_time': appointment.appointment_time,
            'timestamp': datetime.now().isoformat()
        }
        
        # QR kod oluştur
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(str(qr_data))
        qr.make(fit=True)
        
        # QR kodu image'e çevir
        qr_image = qr.make_image(fill_color="black", back_color="white")
        
        # Base64'e encode et
        buffer = io.BytesIO()
        qr_image.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Veritabanına kaydet
        qr_code_record = QRCode(
            id=str(uuid.uuid4()),
            appointment_id=appointment_id,
            qr_code_data=qr_base64,
            expires_at=datetime.now() + timedelta(hours=24)  # 24 saat geçerli
        )
        
        db.session.add(qr_code_record)
        db.session.commit()
        
        return jsonify({
            'message': 'QR kod başarıyla oluşturuldu',
            'qr_code': {
                'id': qr_code_record.id,
                'data': qr_base64,
                'expires_at': qr_code_record.expires_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/qr/checkin', methods=['POST'])
def qr_checkin():
    try:
        data = request.json
        qr_code_id = data.get('qr_code_id')
        
        if not qr_code_id:
            return jsonify({'error': 'QR kod ID gerekli'}), 400
        
        qr_code = QRCode.query.get(qr_code_id)
        if not qr_code:
            return jsonify({'error': 'QR kod bulunamadı'}), 404
        
        if qr_code.used:
            return jsonify({'error': 'QR kod zaten kullanılmış'}), 400
        
        if datetime.now() > qr_code.expires_at:
            return jsonify({'error': 'QR kod süresi dolmuş'}), 400
        
        # Check-in işlemi
        appointment = Appointment.query.get(qr_code.appointment_id)
        if appointment:
            appointment.status = 'checked_in'
            appointment.updated_at = datetime.utcnow()
        
        qr_code.used = True
        qr_code.used_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Check-in başarılı',
            'appointment': appointment.to_dict() if appointment else None
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Staff Management Routes
@app.route('/staff', methods=['GET'])
def get_staff():
    try:
        provider_id = request.args.get('provider_id')
        
        query = Staff.query
        if provider_id:
            query = query.filter_by(provider_id=provider_id)
        
        staff_list = query.filter_by(is_active=True).all()
        staff_data = []
        
        for staff in staff_list:
            staff_dict = staff.to_dict()
            # User bilgisini ekle
            user = User.query.get(staff.user_id)
            staff_dict['user_name'] = user.name if user else None
            staff_dict['user_email'] = user.email if user else None
            staff_data.append(staff_dict)
        
        return jsonify({
            'staff': staff_data,
            'total': len(staff_data)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/staff', methods=['POST'])
def create_staff():
    try:
        data = request.json
        
        new_staff = Staff(
            id=str(uuid.uuid4()),
            provider_id=data.get('provider_id', ''),
            user_id=data.get('user_id', ''),
            position=data.get('position', ''),
            department=data.get('department', ''),
            hire_date=datetime.strptime(data.get('hire_date'), '%Y-%m-%d').date() if data.get('hire_date') else None,
            salary=data.get('salary', 0),
            permissions=data.get('permissions', '{}')
        )
        
        db.session.add(new_staff)
        db.session.commit()
        
        return jsonify({
            'message': 'Personel başarıyla eklendi',
            'staff': new_staff.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/shifts', methods=['GET'])
def get_shifts():
    try:
        staff_id = request.args.get('staff_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = Shift.query
        
        if staff_id:
            query = query.filter_by(staff_id=staff_id)
        
        if date_from:
            query = query.filter(Shift.shift_date >= datetime.strptime(date_from, '%Y-%m-%d').date())
        
        if date_to:
            query = query.filter(Shift.shift_date <= datetime.strptime(date_to, '%Y-%m-%d').date())
        
        shifts = query.order_by(Shift.shift_date.desc()).all()
        shift_data = []
        
        for shift in shifts:
            shift_dict = shift.to_dict()
            # Staff bilgisini ekle
            staff = Staff.query.get(shift.staff_id)
            if staff:
                user = User.query.get(staff.user_id)
                shift_dict['staff_name'] = user.name if user else None
                shift_dict['staff_position'] = staff.position
            shift_data.append(shift_dict)
        
        return jsonify({
            'shifts': shift_data,
            'total': len(shift_data)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/shifts', methods=['POST'])
def create_shift():
    try:
        data = request.json
        
        new_shift = Shift(
            id=str(uuid.uuid4()),
            staff_id=data.get('staff_id', ''),
            shift_date=datetime.strptime(data.get('shift_date'), '%Y-%m-%d').date(),
            start_time=data.get('start_time', '09:00'),
            end_time=data.get('end_time', '17:00'),
            shift_type=data.get('shift_type', 'regular'),
            notes=data.get('notes', '')
        )
        
        db.session.add(new_shift)
        db.session.commit()
        
        return jsonify({
            'message': 'Vardiya başarıyla oluşturuldu',
            'shift': new_shift.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Password Reset Routes
@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email gerekli'}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'Bu email ile kayıtlı kullanıcı bulunamadı'}), 404
        
        # Reset token oluştur
        token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
        
        # Önceki kullanılmamış token'ları iptal et
        PasswordReset.query.filter_by(email=email, used=False).update({'used': True})
        
        # Yeni reset kaydı oluştur
        reset_record = PasswordReset(
            id=str(uuid.uuid4()),
            email=email,
            token=token,
            expires_at=datetime.now() + timedelta(hours=1)  # 1 saat geçerli
        )
        
        db.session.add(reset_record)
        db.session.commit()
        
        # Gerçek uygulamada burada email gönderilir
        # Şimdilik token'ı response'ta döndürüyoruz (sadece development için)
        
        return jsonify({
            'message': 'Şifre sıfırlama talebi oluşturuldu',
            'reset_token': token,  # Production'da bu gönderilmez
            'expires_at': reset_record.expires_at.isoformat()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token ve yeni şifre gerekli'}), 400
        
        # Token'ı kontrol et
        reset_record = PasswordReset.query.filter_by(token=token, used=False).first()
        if not reset_record:
            return jsonify({'error': 'Geçersiz veya kullanılmış token'}), 400
        
        if datetime.now() > reset_record.expires_at:
            return jsonify({'error': 'Token süresi dolmuş'}), 400
        
        # Kullanıcıyı bul ve şifresini güncelle
        user = User.query.filter_by(email=reset_record.email).first()
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
        
        # Şifreyi güncelle (gerçek uygulamada hash'lenmeli)
        user.password = new_password
        user.updated_at = datetime.utcnow()
        
        # Token'ı kullanılmış olarak işaretle
        reset_record.used = True
        
        db.session.commit()
        
        return jsonify({
            'message': 'Şifre başarıyla güncellendi'
        }), 200
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