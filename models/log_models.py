#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from sqlalchemy import Index
from typing import Dict, Any
import json
import uuid

db = SQLAlchemy()

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
        Index('idx_timestamp_level', 'timestamp', 'level'),
        Index('idx_category_timestamp', 'category', 'timestamp'),
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_endpoint_timestamp', 'endpoint', 'timestamp'),
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
            # Fallback to file logging if database fails
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
        Index('idx_timestamp_severity', 'timestamp', 'severity'),
        Index('idx_event_type_timestamp', 'event_type', 'timestamp'),
        Index('idx_ip_timestamp', 'ip_address', 'timestamp'),
        Index('idx_user_timestamp_sec', 'user_id', 'timestamp'),
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
        Index('idx_action_timestamp', 'action', 'timestamp'),
        Index('idx_table_timestamp', 'table_name', 'timestamp'),
        Index('idx_user_audit_timestamp', 'user_id', 'timestamp'),
        Index('idx_record_timestamp', 'record_id', 'timestamp'),
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
        Index('idx_endpoint_response_time', 'endpoint', 'response_time'),
        Index('idx_timestamp_slow', 'timestamp', 'slow_query'),
        Index('idx_performance_metrics', 'response_time', 'status_code'),
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