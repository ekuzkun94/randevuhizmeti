#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
from flask import jsonify

def validate_request_data(data: Dict[str, Any], rules: Dict[str, Dict[str, Any]]) -> Tuple[Dict[str, Any], List[str]]:
    """
    Request verilerini belirli kurallara göre validate et
    
    Args:
        data: Validate edilecek veri
        rules: Validation kuralları
    
    Returns:
        Tuple[validated_data, errors]
    """
    validated_data = {}
    errors = []
    
    if not data:
        data = {}
    
    for field, field_rules in rules.items():
        value = data.get(field)
        
        # Required kontrolü
        if field_rules.get('required', False) and (value is None or value == ''):
            errors.append(f"{field} alanı gereklidir")
            continue
        
        # Default değer ataması
        if value is None and 'default' in field_rules:
            value = field_rules['default']
        
        # Değer varsa type ve diğer kontrolleri yap
        if value is not None:
            # Type kontrolü
            field_type = field_rules.get('type', 'string')
            if not _validate_type(value, field_type):
                errors.append(f"{field} alanı {field_type} tipinde olmalıdır")
                continue
            
            # Min length kontrolü
            if 'min_length' in field_rules:
                if len(str(value)) < field_rules['min_length']:
                    errors.append(f"{field} alanı en az {field_rules['min_length']} karakter olmalıdır")
                    continue
            
            # Max length kontrolü
            if 'max_length' in field_rules:
                if len(str(value)) > field_rules['max_length']:
                    errors.append(f"{field} alanı en fazla {field_rules['max_length']} karakter olmalıdır")
                    continue
            
            # Min value kontrolü
            if 'min_value' in field_rules:
                try:
                    if float(value) < field_rules['min_value']:
                        errors.append(f"{field} alanı en az {field_rules['min_value']} olmalıdır")
                        continue
                except (ValueError, TypeError):
                    errors.append(f"{field} alanı sayısal değer olmalıdır")
                    continue
            
            # Max value kontrolü
            if 'max_value' in field_rules:
                try:
                    if float(value) > field_rules['max_value']:
                        errors.append(f"{field} alanı en fazla {field_rules['max_value']} olmalıdır")
                        continue
                except (ValueError, TypeError):
                    errors.append(f"{field} alanı sayısal değer olmalıdır")
                    continue
            
            # Pattern kontrolü
            if 'pattern' in field_rules:
                if not re.match(field_rules['pattern'], str(value)):
                    errors.append(f"{field} alanı geçersiz format")
                    continue
            
            # Allowed values kontrolü
            if 'allowed_values' in field_rules:
                if value not in field_rules['allowed_values']:
                    errors.append(f"{field} alanı şu değerlerden biri olmalıdır: {', '.join(map(str, field_rules['allowed_values']))}")
                    continue
            
            # Custom validator
            if 'validator' in field_rules:
                validator_result = field_rules['validator'](value)
                if validator_result is not True:
                    errors.append(validator_result if isinstance(validator_result, str) else f"{field} alanı geçersiz")
                    continue
        
        validated_data[field] = value
    
    return validated_data, errors

def _validate_type(value: Any, expected_type: str) -> bool:
    """Değerin tipini kontrol et"""
    if expected_type == 'string':
        return isinstance(value, str)
    elif expected_type == 'integer':
        return isinstance(value, int) or (isinstance(value, str) and value.isdigit())
    elif expected_type == 'float':
        try:
            float(value)
            return True
        except (ValueError, TypeError):
            return False
    elif expected_type == 'boolean':
        return isinstance(value, bool) or str(value).lower() in ['true', 'false', '1', '0']
    elif expected_type == 'email':
        return isinstance(value, str) and _validate_email(value)
    elif expected_type == 'date':
        return _validate_date(value)
    elif expected_type == 'datetime':
        return _validate_datetime(value)
    elif expected_type == 'phone':
        return _validate_phone(value)
    elif expected_type == 'uuid':
        return _validate_uuid(value)
    else:
        return True

def _validate_email(email: str) -> bool:
    """Email formatını kontrol et"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def _validate_date(date_str: str) -> bool:
    """Tarih formatını kontrol et (YYYY-MM-DD)"""
    try:
        datetime.strptime(str(date_str), '%Y-%m-%d')
        return True
    except ValueError:
        return False

def _validate_datetime(datetime_str: str) -> bool:
    """Datetime formatını kontrol et (ISO format)"""
    try:
        datetime.fromisoformat(str(datetime_str).replace('Z', '+00:00'))
        return True
    except ValueError:
        return False

def _validate_phone(phone: str) -> bool:
    """Telefon numarası formatını kontrol et"""
    # Basit telefon numarası kontrolü - TR formatı
    pattern = r'^(\+90|0)?[5][0-9]{9}$'
    clean_phone = re.sub(r'[\s\-\(\)]', '', str(phone))
    return bool(re.match(pattern, clean_phone))

def _validate_uuid(uuid_str: str) -> bool:
    """UUID formatını kontrol et"""
    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    return bool(re.match(pattern, str(uuid_str), re.IGNORECASE))

# Custom validator functions
def validate_appointment_time(time_str: str) -> bool:
    """Randevu saati formatını kontrol et (HH:MM)"""
    try:
        time_obj = datetime.strptime(time_str, '%H:%M').time()
        # İş saatleri kontrolü (09:00 - 18:00)
        return time_obj >= datetime.strptime('09:00', '%H:%M').time() and \
               time_obj <= datetime.strptime('18:00', '%H:%M').time()
    except ValueError:
        return False

def validate_future_date(date_str: str) -> bool:
    """Gelecek tarih kontrolü"""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        return date_obj >= datetime.now().date()
    except ValueError:
        return False

def validate_price(price: Any) -> bool:
    """Fiyat kontrolü (pozitif sayı)"""
    try:
        price_float = float(price)
        return price_float >= 0
    except (ValueError, TypeError):
        return False

def validate_duration(duration: Any) -> bool:
    """Süre kontrolü (15-480 dakika arası)"""
    try:
        duration_int = int(duration)
        return 15 <= duration_int <= 480  # 15 dakika - 8 saat
    except (ValueError, TypeError):
        return False

# Predefined validation rule sets
APPOINTMENT_VALIDATION_RULES = {
    'customer_name': {'required': True, 'type': 'string', 'min_length': 2, 'max_length': 255},
    'customer_email': {'required': True, 'type': 'email'},
    'customer_phone': {'required': False, 'type': 'phone'},
    'provider_id': {'required': True, 'type': 'uuid'},
    'service_id': {'required': True, 'type': 'uuid'},
    'appointment_date': {'required': True, 'type': 'date', 'validator': validate_future_date},
    'appointment_time': {'required': True, 'type': 'string', 'validator': validate_appointment_time},
    'notes': {'required': False, 'type': 'string', 'max_length': 1000},
    'is_guest': {'required': False, 'type': 'boolean', 'default': False}
}

SERVICE_VALIDATION_RULES = {
    'name': {'required': True, 'type': 'string', 'min_length': 2, 'max_length': 255},
    'description': {'required': False, 'type': 'string', 'max_length': 1000},
    'duration': {'required': True, 'type': 'integer', 'validator': validate_duration},
    'price': {'required': True, 'type': 'float', 'validator': validate_price},
    'provider_id': {'required': True, 'type': 'uuid'},
    'category': {'required': False, 'type': 'string', 'max_length': 100},
    'is_active': {'required': False, 'type': 'boolean', 'default': True}
}

PROVIDER_VALIDATION_RULES = {
    'business_name': {'required': False, 'type': 'string', 'max_length': 255},
    'description': {'required': False, 'type': 'string', 'max_length': 1000},
    'specialization': {'required': False, 'type': 'string', 'max_length': 255},
    'experience_years': {'required': False, 'type': 'integer', 'min_value': 0, 'max_value': 50},
    'phone': {'required': False, 'type': 'phone'},
    'address': {'required': False, 'type': 'string', 'max_length': 500},
    'city': {'required': False, 'type': 'string', 'max_length': 100}
}

WORKING_HOURS_VALIDATION_RULES = {
    'provider_id': {'required': True, 'type': 'uuid'},
    'day_of_week': {'required': True, 'type': 'integer', 'min_value': 0, 'max_value': 6},
    'start_time': {'required': True, 'type': 'string', 'pattern': r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'},
    'end_time': {'required': True, 'type': 'string', 'pattern': r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'},
    'is_available': {'required': False, 'type': 'boolean', 'default': True}
}

def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> Optional[tuple]:
    """
    Gerekli alanların varlığını kontrol et
    
    Args:
        data: Kontrol edilecek data dictionary
        required_fields: Gerekli alan listesi
    
    Returns:
        None eğer tüm alanlar mevcut, aksi takdirde error response tuple
    """
    if not data:
        return jsonify({
            'success': False,
            'message': 'Request body boş olamaz'
        }), 400
    
    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            missing_fields.append(field)
    
    if missing_fields:
        return jsonify({
            'success': False,
            'message': f'Zorunlu alanlar eksik: {", ".join(missing_fields)}'
        }), 400
    
    return None 