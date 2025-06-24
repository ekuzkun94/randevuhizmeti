#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import traceback
import psutil
import os
from datetime import datetime, timezone
from functools import wraps
from flask import request, g
from typing import Dict, Any, Optional
import json

# Conditionally import models
try:
    from models.log_models import SystemLog, SecurityLog, AuditLog, PerformanceLog, db
    DATABASE_LOGGING = True
except ImportError:
    DATABASE_LOGGING = False
    print("⚠️ Database logging models not available, falling back to file logging")

class AdvancedLogger:
    """Gelişmiş loglama sistemi"""
    
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Flask app ile initialize et"""
        self.app = app
        
        # Request başlangıcında timing başlat
        @app.before_request
        def before_request():
            g.start_time = time.time()
            g.request_id = f"req_{int(time.time() * 1000)}"
        
        # Request sonrası performance log
        @app.after_request
        def after_request(response):
            if hasattr(g, 'start_time'):
                response_time = time.time() - g.start_time
                
                # Slow query detection (>1 second)
                if response_time > 1.0:
                    self.log_performance(
                        endpoint=request.endpoint or request.path,
                        method=request.method,
                        response_time=response_time,
                        status_code=response.status_code,
                        slow_query=True
                    )
                
                # Normal performance logging for all requests
                elif response_time > 0.1:  # Log if >100ms
                    self.log_performance(
                        endpoint=request.endpoint or request.path,
                        method=request.method,
                        response_time=response_time,
                        status_code=response.status_code
                    )
            
            return response
    
    def log_system(self, level: str, category: str, message: str, **kwargs):
        """Sistem logu kaydet"""
        try:
            # Database logging
            if DATABASE_LOGGING:
                SystemLog.create_log(
                    level=level,
                    category=category,
                    message=message,
                    user_id=kwargs.get('user_id'),
                    ip_address=self._get_ip(),
                    user_agent=self._get_user_agent(),
                    endpoint=kwargs.get('endpoint', self._get_endpoint()),
                    method=kwargs.get('method', self._get_method()),
                    status_code=kwargs.get('status_code'),
                    response_time=kwargs.get('response_time'),
                    extra_data=kwargs.get('extra_data'),
                    server_name=os.getenv('SERVER_NAME', 'local'),
                    environment=os.getenv('FLASK_ENV', 'development')
                )
            
            # File logging fallback
            self._file_log(level, category, message, kwargs)
            
        except Exception as e:
            # Fallback to print if all logging fails
            print(f"Logging failed: {e}")
            print(f"[{level}] [{category}] {message}")
    
    def log_security(self, event_type: str, success: bool = None, 
                    user_id: str = None, email: str = None, 
                    reason: str = None, severity: str = 'medium', **kwargs):
        """Güvenlik logu kaydet"""
        try:
            if DATABASE_LOGGING:
                security_log = SecurityLog(
                    event_type=event_type,
                    severity=severity,
                    user_id=user_id,
                    email=email,
                    role_id=kwargs.get('role_id'),
                    ip_address=self._get_ip(),
                    user_agent=self._get_user_agent(),
                    endpoint=self._get_endpoint(),
                    method=self._get_method(),
                    success=success,
                    reason=reason,
                    risk_score=self._calculate_risk_score(event_type, success),
                    blocked=kwargs.get('blocked', False)
                )
                
                if kwargs.get('details'):
                    security_log.details = json.dumps(kwargs['details'], default=str)
                
                db.session.add(security_log)
                db.session.commit()
            
            # Also log to system logs
            self.log_system(
                'WARNING' if not success else 'INFO',
                'security',
                f"Security event: {event_type} - {reason or 'Success'}",
                user_id=user_id,
                extra_data={
                    'event_type': event_type,
                    'severity': severity,
                    'success': success,
                    'email': email
                }
            )
            
        except Exception as e:
            print(f"Security logging failed: {e}")
    
    def log_audit(self, action: str, table_name: str, record_id: str = None,
                  user_id: str = None, user_email: str = None, user_role: str = None,
                  old_values: Dict = None, new_values: Dict = None, changes: Dict = None):
        """Denetim logu kaydet"""
        try:
            if DATABASE_LOGGING and user_id:
                audit_log = AuditLog(
                    action=action.upper(),
                    table_name=table_name,
                    record_id=record_id,
                    user_id=user_id,
                    user_email=user_email,
                    user_role=user_role,
                    ip_address=self._get_ip(),
                    user_agent=self._get_user_agent(),
                    endpoint=self._get_endpoint()
                )
                
                if old_values:
                    audit_log.old_values = json.dumps(old_values, default=str)
                if new_values:
                    audit_log.new_values = json.dumps(new_values, default=str)
                if changes:
                    audit_log.changes = json.dumps(changes, default=str)
                
                db.session.add(audit_log)
                db.session.commit()
            
            # System log
            self.log_system(
                'INFO',
                'audit',
                f"Audit: {action} on {table_name} (ID: {record_id})",
                user_id=user_id,
                extra_data={
                    'action': action,
                    'table_name': table_name,
                    'record_id': record_id,
                    'user_email': user_email
                }
            )
            
        except Exception as e:
            print(f"Audit logging failed: {e}")
    
    def log_performance(self, endpoint: str, method: str, response_time: float,
                       status_code: int = None, user_id: str = None, 
                       slow_query: bool = False, **kwargs):
        """Performans logu kaydet"""
        try:
            if DATABASE_LOGGING:
                # Get system metrics
                process = psutil.Process()
                memory_info = process.memory_info()
                
                perf_log = PerformanceLog(
                    endpoint=endpoint,
                    method=method,
                    user_id=user_id,
                    response_time=response_time,
                    memory_usage=memory_info.rss,  # Resident Set Size
                    cpu_usage=process.cpu_percent(),
                    db_queries=kwargs.get('db_queries', 0),
                    db_time=kwargs.get('db_time', 0.0),
                    status_code=status_code,
                    response_size=kwargs.get('response_size'),
                    slow_query=slow_query
                )
                
                if hasattr(request, 'args') and request.args:
                    perf_log.query_params = json.dumps(dict(request.args))
                
                db.session.add(perf_log)
                db.session.commit()
            
            # Log slow queries to system logs
            if slow_query:
                self.log_system(
                    'WARNING',
                    'performance',
                    f"Slow query detected: {endpoint} took {response_time:.2f}s",
                    user_id=user_id,
                    endpoint=endpoint,
                    response_time=response_time,
                    extra_data={'slow_query': True, 'threshold': 1.0}
                )
                
        except Exception as e:
            print(f"Performance logging failed: {e}")
    
    def log_error(self, error: Exception, context: str = None, **kwargs):
        """Hata logu kaydet"""
        try:
            error_message = str(error)
            stack_trace = traceback.format_exc()
            
            self.log_system(
                'ERROR',
                'error',
                f"Error in {context or 'unknown'}: {error_message}",
                user_id=kwargs.get('user_id'),
                extra_data={
                    'error_type': type(error).__name__,
                    'error_message': error_message,
                    'stack_trace': stack_trace,
                    'context': context,
                    **kwargs
                }
            )
            
        except Exception as e:
            print(f"Error logging failed: {e}")
    
    def _get_ip(self) -> str:
        """Client IP adresini al"""
        try:
            if hasattr(request, 'environ'):
                # Try various headers for real IP
                for header in ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR']:
                    ip = request.environ.get(header)
                    if ip:
                        return ip.split(',')[0].strip()
                return request.remote_addr or 'unknown'
            return 'unknown'
        except:
            return 'unknown'
    
    def _get_user_agent(self) -> str:
        """User agent al"""
        try:
            return request.headers.get('User-Agent', 'unknown') if hasattr(request, 'headers') else 'unknown'
        except:
            return 'unknown'
    
    def _get_endpoint(self) -> str:
        """Endpoint al"""
        try:
            return request.endpoint or request.path if hasattr(request, 'endpoint') else 'unknown'
        except:
            return 'unknown'
    
    def _get_method(self) -> str:
        """HTTP method al"""
        try:
            return request.method if hasattr(request, 'method') else 'unknown'
        except:
            return 'unknown'
    
    def _calculate_risk_score(self, event_type: str, success: bool) -> int:
        """Risk skoru hesapla"""
        base_scores = {
            'login_attempt': 10,
            'permission_denied': 30,
            'rate_limit_exceeded': 25,
            'suspicious_activity': 50,
            'data_breach': 90,
            'unauthorized_access': 70
        }
        
        score = base_scores.get(event_type, 20)
        
        # Başarısız işlemler daha riskli
        if success is False:
            score += 20
        
        return min(score, 100)
    
    def _file_log(self, level: str, category: str, message: str, extra: Dict):
        """File logging fallback"""
        try:
            log_dir = 'logs'
            if not os.path.exists(log_dir):
                os.makedirs(log_dir)
            
            timestamp = datetime.now(timezone.utc).isoformat()
            log_entry = f"[{timestamp}] [{level}] [{category}] {message}\n"
            
            with open(f"{log_dir}/app.log", "a", encoding="utf-8") as f:
                f.write(log_entry)
                
        except Exception as e:
            print(f"File logging failed: {e}")

# Global logger instance
advanced_logger = AdvancedLogger()

# Decorator functions
def log_performance_metrics(f):
    """Performance logging decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        try:
            result = f(*args, **kwargs)
            response_time = time.time() - start_time
            
            advanced_logger.log_performance(
                endpoint=f.__name__,
                method=request.method if hasattr(request, 'method') else 'UNKNOWN',
                response_time=response_time,
                user_id=getattr(request, 'current_user', {}).get('user_id') if hasattr(request, 'current_user') else None
            )
            
            return result
        except Exception as e:
            response_time = time.time() - start_time
            advanced_logger.log_error(e, context=f.__name__, response_time=response_time)
            raise
    
    return decorated_function

def log_data_changes(table_name: str, action: str = None):
    """Data change logging decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Determine action from function name if not provided
            if action is None:
                func_name = f.__name__.lower()
                if 'create' in func_name or 'add' in func_name:
                    log_action = 'CREATE'
                elif 'update' in func_name or 'edit' in func_name:
                    log_action = 'UPDATE'
                elif 'delete' in func_name or 'remove' in func_name:
                    log_action = 'DELETE'
                else:
                    log_action = 'UNKNOWN'
            else:
                log_action = action.upper()
            
            try:
                result = f(*args, **kwargs)
                
                # Log the audit trail
                user_id = getattr(request, 'current_user', {}).get('user_id') if hasattr(request, 'current_user') else None
                if user_id:
                    advanced_logger.log_audit(
                        action=log_action,
                        table_name=table_name,
                        user_id=user_id,
                        user_email=getattr(request, 'current_user', {}).get('email'),
                        user_role=getattr(request, 'current_user', {}).get('role_id')
                    )
                
                return result
            except Exception as e:
                advanced_logger.log_error(e, context=f"Data operation: {log_action} on {table_name}")
                raise
        
        return decorated_function
    return decorator 