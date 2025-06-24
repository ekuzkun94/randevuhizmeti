#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import structlog
import logging
import logging.handlers
import os
from datetime import datetime
from typing import Any, Dict

def setup_logging(app_config: Dict[str, Any]) -> None:
    """Logging sistemini yapılandır"""
    
    # Log seviyesini ayarla
    log_level = getattr(logging, app_config.get('LOG_LEVEL', 'INFO').upper())
    
    # Log klasörünü oluştur
    log_dir = os.path.dirname(app_config.get('LOG_FILE', 'logs/app.log'))
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Standard logging yapılandırması
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.handlers.RotatingFileHandler(
                app_config.get('LOG_FILE', 'logs/app.log'),
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            ),
            logging.StreamHandler()
        ]
    )
    
    # Structlog yapılandırması
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

class SecurityLogger:
    """Güvenlik olayları için özel logger"""
    
    def __init__(self):
        self.logger = structlog.get_logger("security")
    
    def log_login_attempt(self, email: str, success: bool, ip_address: str, user_agent: str = None):
        """Giriş denemelerini logla"""
        self.logger.info(
            "login_attempt",
            email=email,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.now().isoformat()
        )
    
    def log_failed_authentication(self, email: str, reason: str, ip_address: str):
        """Başarısız authentication'ları logla"""
        self.logger.warning(
            "failed_authentication",
            email=email,
            reason=reason,
            ip_address=ip_address,
            timestamp=datetime.now().isoformat()
        )
    
    def log_permission_denied(self, user_id: str, resource: str, action: str, ip_address: str):
        """Yetki hatalarını logla"""
        self.logger.warning(
            "permission_denied",
            user_id=user_id,
            resource=resource,
            action=action,
            ip_address=ip_address,
            timestamp=datetime.now().isoformat()
        )
    
    def log_rate_limit_exceeded(self, ip_address: str, endpoint: str):
        """Rate limit aşımlarını logla"""
        self.logger.warning(
            "rate_limit_exceeded",
            ip_address=ip_address,
            endpoint=endpoint,
            timestamp=datetime.now().isoformat()
        )
    
    def log_suspicious_activity(self, user_id: str, activity: str, details: Dict[str, Any], ip_address: str):
        """Şüpheli aktiviteleri logla"""
        self.logger.error(
            "suspicious_activity",
            user_id=user_id,
            activity=activity,
            details=details,
            ip_address=ip_address,
            timestamp=datetime.now().isoformat()
        )

class AppLogger:
    """Uygulama olayları için logger"""
    
    def __init__(self):
        self.logger = structlog.get_logger("app")
    
    def log_api_request(self, method: str, endpoint: str, user_id: str = None, 
                       status_code: int = None, response_time: float = None):
        """API isteklerini logla"""
        self.logger.info(
            "api_request",
            method=method,
            endpoint=endpoint,
            user_id=user_id,
            status_code=status_code,
            response_time=response_time,
            timestamp=datetime.now().isoformat()
        )
    
    def log_database_operation(self, operation: str, table: str, record_id: str = None, 
                              user_id: str = None, success: bool = True):
        """Veritabanı işlemlerini logla"""
        self.logger.info(
            "database_operation",
            operation=operation,
            table=table,
            record_id=record_id,
            user_id=user_id,
            success=success,
            timestamp=datetime.now().isoformat()
        )
    
    def log_business_event(self, event_type: str, details: Dict[str, Any], user_id: str = None):
        """İş süreçlerini logla"""
        self.logger.info(
            "business_event",
            event_type=event_type,
            details=details,
            user_id=user_id,
            timestamp=datetime.now().isoformat()
        )
    
    def log_error(self, error_type: str, error_message: str, stack_trace: str = None, 
                  user_id: str = None, request_data: Dict[str, Any] = None):
        """Hataları logla"""
        self.logger.error(
            "application_error",
            error_type=error_type,
            error_message=error_message,
            stack_trace=stack_trace,
            user_id=user_id,
            request_data=request_data,
            timestamp=datetime.now().isoformat()
        )

# Global logger instances
security_logger = SecurityLogger()
app_logger = AppLogger() 