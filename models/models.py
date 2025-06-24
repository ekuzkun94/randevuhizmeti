#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from sqlalchemy import func
from typing import Dict, Any, Optional
import uuid
import json

db = SQLAlchemy()

class BaseModel:
    """Base model sınıfı - ortak metodlar"""
    
    def to_dict(self) -> Dict[str, Any]:
        """Model'i dictionary'e çevir"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat() if value else None
            else:
                result[column.name] = value
        return result
    
    def save(self):
        """Model'i kaydet"""
        try:
            db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e
    
    def delete(self):
        """Model'i sil"""
        try:
            db.session.delete(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e

class User(db.Model, BaseModel):
    """Kullanıcı modeli"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.String(36), nullable=False, index=True)
    phone = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    email_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    provider = db.relationship('Provider', backref='user', uselist=False)
    appointments = db.relationship('Appointment', foreign_keys='Appointment.customer_id', backref='customer')
    
    def to_dict(self) -> Dict[str, Any]:
        """Override to exclude password_hash"""
        data = super().to_dict()
        data.pop('password_hash', None)
        return data
    
    @classmethod
    def get_by_email(cls, email: str) -> Optional['User']:
        """Email ile kullanıcı bul"""
        return cls.query.filter_by(email=email).first()
    
    @classmethod
    def get_by_id(cls, user_id: str) -> Optional['User']:
        """ID ile kullanıcı bul"""
        return cls.query.get(user_id)

class Role(db.Model, BaseModel):
    """Rol modeli"""
    __tablename__ = 'roles'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    permissions = db.Column(db.Text)  # JSON format
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Provider(db.Model, BaseModel):
    """Hizmet sağlayıcı modeli"""
    __tablename__ = 'providers'
    
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
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
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    services = db.relationship('Service', backref='provider', lazy=True, cascade='all, delete-orphan')
    working_hours = db.relationship('WorkingHour', backref='provider', lazy=True, cascade='all, delete-orphan')
    appointments = db.relationship('Appointment', foreign_keys='Appointment.provider_id', backref='provider_info')

class Service(db.Model, BaseModel):
    """Hizmet modeli"""
    __tablename__ = 'services'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    duration = db.Column(db.Integer, default=60)  # Dakika cinsinden
    price = db.Column(db.Numeric(10, 2), default=0.00)
    provider_id = db.Column(db.String(36), db.ForeignKey('providers.id'), nullable=False)
    category = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    appointments = db.relationship('Appointment', backref='service', lazy=True)
    
    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        if data.get('price'):
            data['price'] = float(data['price'])
        return data

class WorkingHour(db.Model, BaseModel):
    """Çalışma saatleri modeli"""
    __tablename__ = 'working_hours'
    
    id = db.Column(db.String(36), primary_key=True)
    provider_id = db.Column(db.String(36), db.ForeignKey('providers.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    start_time = db.Column(db.String(10), nullable=False)  # HH:MM formatında
    end_time = db.Column(db.String(10), nullable=False)  # HH:MM formatında
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Appointment(db.Model, BaseModel):
    """Randevu modeli"""
    __tablename__ = 'appointments'
    
    id = db.Column(db.String(36), primary_key=True)
    customer_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    customer_name = db.Column(db.String(255))
    customer_email = db.Column(db.String(255))
    customer_phone = db.Column(db.String(20))
    provider_id = db.Column(db.String(36), db.ForeignKey('providers.id'), nullable=False)
    service_id = db.Column(db.String(36), db.ForeignKey('services.id'), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False, index=True)
    appointment_time = db.Column(db.String(10), nullable=False)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending', index=True)
    is_guest = db.Column(db.Boolean, default=False)
    duration = db.Column(db.Integer)
    location = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2))
    payment_status = db.Column(db.String(20), default='pending')
    
    # Onay sistemi alanları
    approval_level = db.Column(db.Integer, default=0)
    approval_status = db.Column(db.String(20), default='none')
    approvers = db.Column(db.Text)  # JSON format
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    qr_codes = db.relationship('QRCode', backref='appointment', lazy=True, cascade='all, delete-orphan')
    approvals = db.relationship('Approval', backref='appointment', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        if data.get('price'):
            data['price'] = float(data['price'])
        return data
    
    @classmethod
    def get_by_provider_and_date(cls, provider_id: str, date: str):
        """Provider ve tarihe göre randevuları getir"""
        return cls.query.filter_by(
            provider_id=provider_id,
            appointment_date=date
        ).all()

class Staff(db.Model, BaseModel):
    """Personel modeli"""
    __tablename__ = 'staff'
    
    id = db.Column(db.String(36), primary_key=True)
    provider_id = db.Column(db.String(36), db.ForeignKey('providers.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    position = db.Column(db.String(100))
    department = db.Column(db.String(100))
    hire_date = db.Column(db.Date)
    salary = db.Column(db.Numeric(10, 2))
    is_active = db.Column(db.Boolean, default=True)
    permissions = db.Column(db.Text)  # JSON format
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = db.relationship('User', backref='staff_profile')
    shifts = db.relationship('Shift', backref='staff_member', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        if data.get('salary'):
            data['salary'] = float(data['salary'])
        return data

class Shift(db.Model, BaseModel):
    """Vardiya modeli"""
    __tablename__ = 'shifts'
    
    id = db.Column(db.String(36), primary_key=True)
    staff_id = db.Column(db.String(36), db.ForeignKey('staff.id'), nullable=False)
    shift_date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.String(10), nullable=False)
    end_time = db.Column(db.String(10), nullable=False)
    shift_type = db.Column(db.String(20), default='regular')  # regular, overtime, holiday
    status = db.Column(db.String(20), default='scheduled')  # scheduled, started, completed, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class PasswordReset(db.Model, BaseModel):
    """Şifre sıfırlama modeli"""
    __tablename__ = 'password_resets'
    
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    token = db.Column(db.String(100), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    @classmethod
    def get_valid_token(cls, token: str) -> Optional['PasswordReset']:
        """Geçerli token bul"""
        return cls.query.filter_by(
            token=token,
            used=False
        ).filter(
            cls.expires_at > datetime.now(timezone.utc)
        ).first()

class QRCode(db.Model, BaseModel):
    """QR kod modeli"""
    __tablename__ = 'qr_codes'
    
    id = db.Column(db.String(36), primary_key=True)
    appointment_id = db.Column(db.String(36), db.ForeignKey('appointments.id'), nullable=False)
    qr_code_data = db.Column(db.Text, nullable=False)  # Base64 encoded QR code
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Approval(db.Model, BaseModel):
    """Onay modeli"""
    __tablename__ = 'approvals'
    
    id = db.Column(db.String(36), primary_key=True)
    appointment_id = db.Column(db.String(36), db.ForeignKey('appointments.id'), nullable=False)
    approval_level = db.Column(db.Integer, default=1)
    current_step = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default='pending')
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    steps = db.relationship('ApprovalStep', backref='approval', lazy=True, cascade='all, delete-orphan')

class ApprovalStep(db.Model, BaseModel):
    """Onay adımı modeli"""
    __tablename__ = 'approval_steps'
    
    id = db.Column(db.String(36), primary_key=True)
    approval_id = db.Column(db.String(36), db.ForeignKey('approvals.id'), nullable=False)
    step_number = db.Column(db.Integer, nullable=False)
    approver_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    approver_name = db.Column(db.String(255))
    status = db.Column(db.String(20), default='pending')
    approved_at = db.Column(db.DateTime)
    comments = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    approver = db.relationship('User', backref='approval_steps')

# Log Models for Advanced Monitoring
class SystemLog(db.Model):
    """Sistem logları"""
    __tablename__ = 'system_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    level = db.Column(db.String(20), nullable=False, index=True)  # INFO, WARNING, ERROR, CRITICAL
    category = db.Column(db.String(50), nullable=False, index=True)  # api_request, security, business_event, error
    message = db.Column(db.Text, nullable=False)
    
    # Context data
    user_id = db.Column(db.String(36), index=True)
    ip_address = db.Column(db.String(45))  # IPv6 support
    user_agent = db.Column(db.Text)
    endpoint = db.Column(db.String(255), index=True)
    method = db.Column(db.String(10))
    status_code = db.Column(db.Integer)
    response_time = db.Column(db.Float)
    
    # Additional data (JSON)
    extra_data = db.Column(db.Text)  # JSON string
    
    # System info
    server_name = db.Column(db.String(100))
    environment = db.Column(db.String(20), default='development')
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Indexes for performance
    __table_args__ = (
        db.Index('idx_timestamp_level', 'timestamp', 'level'),
        db.Index('idx_category_timestamp', 'category', 'timestamp'),
        db.Index('idx_user_timestamp', 'user_id', 'timestamp'),
        db.Index('idx_endpoint_timestamp', 'endpoint', 'timestamp'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        data = {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'level': self.level,
            'category': self.category,
            'message': self.message,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'endpoint': self.endpoint,
            'method': self.method,
            'status_code': self.status_code,
            'response_time': self.response_time,
            'server_name': self.server_name,
            'environment': self.environment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        # Parse extra_data JSON
        if self.extra_data:
            try:
                data['extra_data'] = json.loads(self.extra_data)
            except json.JSONDecodeError:
                data['extra_data'] = self.extra_data
        
        return data
    
    @classmethod
    def create_log(cls, level: str, category: str, message: str, 
                   user_id: str = None, ip_address: str = None, 
                   user_agent: str = None, endpoint: str = None,
                   method: str = None, status_code: int = None,
                   response_time: float = None, extra_data: Dict = None,
                   server_name: str = None, environment: str = 'development'):
        """Log kaydı oluştur"""
        
        log_entry = cls(
            level=level.upper(),
            category=category,
            message=message,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time=response_time,
            server_name=server_name,
            environment=environment
        )
        
        if extra_data:
            log_entry.extra_data = json.dumps(extra_data, default=str)
        
        try:
            db.session.add(log_entry)
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            print(f"Failed to save log to database: {e}")
            return None

class SecurityLog(db.Model):
    """Güvenlik logları"""
    __tablename__ = 'security_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    event_type = db.Column(db.String(50), nullable=False, index=True)  # login_attempt, permission_denied, etc.
    severity = db.Column(db.String(20), default='medium', index=True)  # low, medium, high, critical
    
    # User context
    user_id = db.Column(db.String(36), index=True)
    email = db.Column(db.String(255), index=True)
    role_id = db.Column(db.String(36))
    
    # Request context
    ip_address = db.Column(db.String(45), index=True)
    user_agent = db.Column(db.Text)
    endpoint = db.Column(db.String(255))
    method = db.Column(db.String(10))
    
    # Event details
    success = db.Column(db.Boolean, index=True)
    reason = db.Column(db.String(255))
    details = db.Column(db.Text)  # JSON string
    
    # Threat analysis
    risk_score = db.Column(db.Integer, default=0)  # 0-100
    blocked = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    __table_args__ = (
        db.Index('idx_timestamp_severity', 'timestamp', 'severity'),
        db.Index('idx_event_type_timestamp', 'event_type', 'timestamp'),
        db.Index('idx_ip_timestamp', 'ip_address', 'timestamp'),
        db.Index('idx_user_timestamp_sec', 'user_id', 'timestamp'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        data = {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'event_type': self.event_type,
            'severity': self.severity,
            'user_id': self.user_id,
            'email': self.email,
            'role_id': self.role_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'endpoint': self.endpoint,
            'method': self.method,
            'success': self.success,
            'reason': self.reason,
            'risk_score': self.risk_score,
            'blocked': self.blocked,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if self.details:
            try:
                data['details'] = json.loads(self.details)
            except json.JSONDecodeError:
                data['details'] = self.details
        
        return data

class AuditLog(db.Model):
    """Denetim logları (CRUD işlemleri)"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Action details
    action = db.Column(db.String(20), nullable=False, index=True)  # CREATE, UPDATE, DELETE, VIEW
    table_name = db.Column(db.String(50), nullable=False, index=True)
    record_id = db.Column(db.String(36), index=True)
    
    # User context
    user_id = db.Column(db.String(36), nullable=False, index=True)
    user_email = db.Column(db.String(255))
    user_role = db.Column(db.String(50))
    
    # Request context
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    endpoint = db.Column(db.String(255))
    
    # Change details
    old_values = db.Column(db.Text)  # JSON string
    new_values = db.Column(db.Text)  # JSON string
    changes = db.Column(db.Text)  # JSON string - specific changes
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    __table_args__ = (
        db.Index('idx_action_timestamp', 'action', 'timestamp'),
        db.Index('idx_table_timestamp', 'table_name', 'timestamp'),
        db.Index('idx_user_audit_timestamp', 'user_id', 'timestamp'),
        db.Index('idx_record_timestamp', 'record_id', 'timestamp'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        data = {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'action': self.action,
            'table_name': self.table_name,
            'record_id': self.record_id,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'user_role': self.user_role,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'endpoint': self.endpoint,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        # Parse JSON fields
        for field in ['old_values', 'new_values', 'changes']:
            value = getattr(self, field)
            if value:
                try:
                    data[field] = json.loads(value)
                except json.JSONDecodeError:
                    data[field] = value
        
        return data

class PerformanceLog(db.Model):
    """Performans logları"""
    __tablename__ = 'performance_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Request details
    endpoint = db.Column(db.String(255), nullable=False, index=True)
    method = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.String(36), index=True)
    
    # Performance metrics
    response_time = db.Column(db.Float, nullable=False, index=True)  # seconds
    memory_usage = db.Column(db.Integer)  # bytes
    cpu_usage = db.Column(db.Float)  # percentage
    
    # Database metrics
    db_queries = db.Column(db.Integer, default=0)
    db_time = db.Column(db.Float, default=0.0)
    
    # Response details
    status_code = db.Column(db.Integer, index=True)
    response_size = db.Column(db.Integer)  # bytes
    
    # Additional context
    query_params = db.Column(db.Text)  # JSON string
    slow_query = db.Column(db.Boolean, default=False, index=True)  # >1 second
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    __table_args__ = (
        db.Index('idx_endpoint_response_time', 'endpoint', 'response_time'),
        db.Index('idx_timestamp_slow', 'timestamp', 'slow_query'),
        db.Index('idx_performance_metrics', 'response_time', 'status_code'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        data = {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'endpoint': self.endpoint,
            'method': self.method,
            'user_id': self.user_id,
            'response_time': self.response_time,
            'memory_usage': self.memory_usage,
            'cpu_usage': self.cpu_usage,
            'db_queries': self.db_queries,
            'db_time': self.db_time,
            'status_code': self.status_code,
            'response_size': self.response_size,
            'slow_query': self.slow_query,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if self.query_params:
            try:
                data['query_params'] = json.loads(self.query_params)
            except json.JSONDecodeError:
                data['query_params'] = self.query_params
        
        return data 