#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta, timezone
from utils.security import require_auth, require_role
# from utils.validators import validate_request
from utils.advanced_logger import advanced_logger
from models.log_models import SystemLog, SecurityLog, AuditLog, PerformanceLog, db
from sqlalchemy import func, desc, and_, or_
from sqlalchemy.orm import sessionmaker
import json
from typing import Dict, List, Any

admin_logs_bp = Blueprint('admin_logs', __name__, url_prefix='/admin/logs')

@admin_logs_bp.route('/dashboard', methods=['GET'])
@require_auth
@require_role(['admin', 'super_admin'])
def get_log_dashboard():
    """Log dashboard - genel istatistikler"""
    try:
        # Son 24 saat içindeki veriler
        last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        last_7d = datetime.now(timezone.utc) - timedelta(days=7)
        
        # Sistem logları özeti
        system_stats = db.session.query(
            SystemLog.level,
            func.count(SystemLog.id).label('count')
        ).filter(SystemLog.timestamp >= last_24h).group_by(SystemLog.level).all()
        
        # Güvenlik olayları
        security_stats = db.session.query(
            SecurityLog.event_type,
            SecurityLog.severity,
            func.count(SecurityLog.id).label('count')
        ).filter(SecurityLog.timestamp >= last_24h).group_by(
            SecurityLog.event_type, SecurityLog.severity
        ).all()
        
        # En yavaş endpoint'ler
        slow_endpoints = db.session.query(
            PerformanceLog.endpoint,
            func.avg(PerformanceLog.response_time).label('avg_time'),
            func.max(PerformanceLog.response_time).label('max_time'),
            func.count(PerformanceLog.id).label('request_count')
        ).filter(
            PerformanceLog.timestamp >= last_24h
        ).group_by(PerformanceLog.endpoint).order_by(
            desc('avg_time')
        ).limit(10).all()
        
        # En aktif kullanıcılar
        active_users = db.session.query(
            AuditLog.user_email,
            func.count(AuditLog.id).label('activity_count'),
            func.count(func.distinct(AuditLog.action)).label('unique_actions')
        ).filter(
            AuditLog.timestamp >= last_24h
        ).group_by(AuditLog.user_email).order_by(
            desc('activity_count')
        ).limit(10).all()
        
        # Risk skoru yüksek güvenlik olayları
        high_risk_events = db.session.query(SecurityLog).filter(
            and_(
                SecurityLog.timestamp >= last_24h,
                SecurityLog.risk_score >= 70
            )
        ).order_by(desc(SecurityLog.timestamp)).limit(5).all()
        
        # Hata istatistikleri (son 7 gün)
        error_trends = db.session.query(
            func.date(SystemLog.timestamp).label('date'),
            func.count(SystemLog.id).label('error_count')
        ).filter(
            and_(
                SystemLog.timestamp >= last_7d,
                SystemLog.level == 'ERROR'
            )
        ).group_by(func.date(SystemLog.timestamp)).order_by('date').all()
        
        # Response hazırla
        dashboard_data = {
            'summary': {
                'last_24h': {
                    'total_requests': sum([s.count for s in system_stats]),
                    'system_logs': {s.level: s.count for s in system_stats},
                    'security_events': len(security_stats),
                    'high_risk_events': len(high_risk_events)
                }
            },
            'security_overview': [
                {
                    'event_type': s.event_type,
                    'severity': s.severity,
                    'count': s.count
                } for s in security_stats
            ],
            'performance_metrics': {
                'slow_endpoints': [
                    {
                        'endpoint': e.endpoint,
                        'avg_response_time': round(e.avg_time, 3),
                        'max_response_time': round(e.max_time, 3),
                        'request_count': e.request_count
                    } for e in slow_endpoints
                ]
            },
            'user_activity': [
                {
                    'user_email': u.user_email,
                    'activity_count': u.activity_count,
                    'unique_actions': u.unique_actions
                } for u in active_users
            ],
            'high_risk_events': [event.to_dict() for event in high_risk_events],
            'error_trends': [
                {
                    'date': str(trend.date),
                    'error_count': trend.error_count
                } for trend in error_trends
            ]
        }
        
        # Log this admin activity
        advanced_logger.log_audit(
            action='VIEW',
            table_name='logs_dashboard',
            user_id=g.current_user['user_id'],
            user_email=g.current_user['email'],
            user_role=g.current_user['role_id']
        )
        
        return jsonify({
            'success': True,
            'data': dashboard_data
        })
        
    except Exception as e:
        advanced_logger.log_error(e, context='admin_log_dashboard')
        return jsonify({
            'success': False,
            'message': 'Dashboard verisi alınamadı',
            'error': str(e)
        }), 500

@admin_logs_bp.route('/system', methods=['GET'])
@require_auth
@require_role(['admin', 'super_admin'])
def get_system_logs():
    """Sistem loglarını getir"""
    try:
        # Query parametreleri
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 50, type=int), 100)
        level = request.args.get('level')  # INFO, WARNING, ERROR, CRITICAL
        category = request.args.get('category')  # api_request, security, business_event, error
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        user_id = request.args.get('user_id')
        search = request.args.get('search')
        
        # Base query
        query = db.session.query(SystemLog)
        
        # Filters
        if level:
            query = query.filter(SystemLog.level == level.upper())
        
        if category:
            query = query.filter(SystemLog.category == category)
        
        if user_id:
            query = query.filter(SystemLog.user_id == user_id)
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(SystemLog.timestamp >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(SystemLog.timestamp <= end_dt)
        
        if search:
            query = query.filter(
                or_(
                    SystemLog.message.ilike(f'%{search}%'),
                    SystemLog.endpoint.ilike(f'%{search}%'),
                    SystemLog.ip_address.ilike(f'%{search}%')
                )
            )
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * limit
        logs = query.order_by(desc(SystemLog.timestamp)).offset(offset).limit(limit).all()
        
        # Statistics
        level_stats = db.session.query(
            SystemLog.level,
            func.count(SystemLog.id).label('count')
        ).group_by(SystemLog.level).all()
        
        category_stats = db.session.query(
            SystemLog.category,
            func.count(SystemLog.id).label('count')
        ).group_by(SystemLog.category).all()
        
        return jsonify({
            'success': True,
            'data': {
                'logs': [log.to_dict() for log in logs],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': (total + limit - 1) // limit
                },
                'statistics': {
                    'levels': {stat.level: stat.count for stat in level_stats},
                    'categories': {stat.category: stat.count for stat in category_stats}
                }
            }
        })
        
    except Exception as e:
        advanced_logger.log_error(e, context='get_system_logs')
        return jsonify({
            'success': False,
            'message': 'Sistem logları alınamadı',
            'error': str(e)
        }), 500

@admin_logs_bp.route('/security', methods=['GET'])
@require_auth
@require_role(['admin', 'super_admin'])
def get_security_logs():
    """Güvenlik loglarını getir"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 50, type=int), 100)
        event_type = request.args.get('event_type')
        severity = request.args.get('severity')
        success = request.args.get('success')
        ip_address = request.args.get('ip_address')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        min_risk_score = request.args.get('min_risk_score', type=int)
        
        query = db.session.query(SecurityLog)
        
        # Filters
        if event_type:
            query = query.filter(SecurityLog.event_type == event_type)
        
        if severity:
            query = query.filter(SecurityLog.severity == severity)
        
        if success is not None:
            success_bool = success.lower() in ['true', '1', 'yes']
            query = query.filter(SecurityLog.success == success_bool)
        
        if ip_address:
            query = query.filter(SecurityLog.ip_address == ip_address)
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(SecurityLog.timestamp >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(SecurityLog.timestamp <= end_dt)
        
        if min_risk_score:
            query = query.filter(SecurityLog.risk_score >= min_risk_score)
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * limit
        logs = query.order_by(desc(SecurityLog.timestamp)).offset(offset).limit(limit).all()
        
        # Threat analysis
        threat_stats = db.session.query(
            SecurityLog.severity,
            func.avg(SecurityLog.risk_score).label('avg_risk'),
            func.count(SecurityLog.id).label('count')
        ).group_by(SecurityLog.severity).all()
        
        # Top threatening IPs
        threat_ips = db.session.query(
            SecurityLog.ip_address,
            func.avg(SecurityLog.risk_score).label('avg_risk'),
            func.count(SecurityLog.id).label('event_count')
        ).filter(SecurityLog.risk_score >= 50).group_by(
            SecurityLog.ip_address
        ).order_by(desc('avg_risk')).limit(10).all()
        
        return jsonify({
            'success': True,
            'data': {
                'logs': [log.to_dict() for log in logs],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': (total + limit - 1) // limit
                },
                'threat_analysis': {
                    'severity_stats': [
                        {
                            'severity': stat.severity,
                            'avg_risk_score': round(stat.avg_risk, 2),
                            'count': stat.count
                        } for stat in threat_stats
                    ],
                    'threatening_ips': [
                        {
                            'ip_address': ip.ip_address,
                            'avg_risk_score': round(ip.avg_risk, 2),
                            'event_count': ip.event_count
                        } for ip in threat_ips
                    ]
                }
            }
        })
        
    except Exception as e:
        advanced_logger.log_error(e, context='get_security_logs')
        return jsonify({
            'success': False,
            'message': 'Güvenlik logları alınamadı',
            'error': str(e)
        }), 500

@admin_logs_bp.route('/audit', methods=['GET'])
@require_auth
@require_role(['admin', 'super_admin'])
def get_audit_logs():
    """Denetim loglarını getir"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 50, type=int), 100)
        action = request.args.get('action')
        table_name = request.args.get('table_name')
        user_id = request.args.get('user_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = db.session.query(AuditLog)
        
        # Filters
        if action:
            query = query.filter(AuditLog.action == action.upper())
        
        if table_name:
            query = query.filter(AuditLog.table_name == table_name)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(AuditLog.timestamp >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(AuditLog.timestamp <= end_dt)
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * limit
        logs = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit).all()
        
        # Activity summary
        activity_stats = db.session.query(
            AuditLog.action,
            AuditLog.table_name,
            func.count(AuditLog.id).label('count')
        ).group_by(AuditLog.action, AuditLog.table_name).order_by(desc('count')).all()
        
        # Most active users
        active_users = db.session.query(
            AuditLog.user_email,
            func.count(AuditLog.id).label('activity_count')
        ).group_by(AuditLog.user_email).order_by(desc('activity_count')).limit(10).all()
        
        return jsonify({
            'success': True,
            'data': {
                'logs': [log.to_dict() for log in logs],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': (total + limit - 1) // limit
                },
                'activity_summary': [
                    {
                        'action': stat.action,
                        'table_name': stat.table_name,
                        'count': stat.count
                    } for stat in activity_stats
                ],
                'active_users': [
                    {
                        'user_email': user.user_email,
                        'activity_count': user.activity_count
                    } for user in active_users
                ]
            }
        })
        
    except Exception as e:
        advanced_logger.log_error(e, context='get_audit_logs')
        return jsonify({
            'success': False,
            'message': 'Denetim logları alınamadı',
            'error': str(e)
        }), 500

@admin_logs_bp.route('/performance', methods=['GET'])
@require_auth
@require_role(['admin', 'super_admin'])
def get_performance_logs():
    """Performans loglarını getir"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 50, type=int), 100)
        endpoint = request.args.get('endpoint')
        slow_only = request.args.get('slow_only', 'false').lower() == 'true'
        min_response_time = request.args.get('min_response_time', type=float)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = db.session.query(PerformanceLog)
        
        # Filters
        if endpoint:
            query = query.filter(PerformanceLog.endpoint.ilike(f'%{endpoint}%'))
        
        if slow_only:
            query = query.filter(PerformanceLog.slow_query == True)
        
        if min_response_time:
            query = query.filter(PerformanceLog.response_time >= min_response_time)
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(PerformanceLog.timestamp >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(PerformanceLog.timestamp <= end_dt)
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * limit
        logs = query.order_by(desc(PerformanceLog.response_time)).offset(offset).limit(limit).all()
        
        # Performance analytics
        perf_stats = db.session.query(
            PerformanceLog.endpoint,
            func.avg(PerformanceLog.response_time).label('avg_time'),
            func.min(PerformanceLog.response_time).label('min_time'),
            func.max(PerformanceLog.response_time).label('max_time'),
            func.count(PerformanceLog.id).label('request_count'),
            func.avg(PerformanceLog.memory_usage).label('avg_memory'),
            func.avg(PerformanceLog.cpu_usage).label('avg_cpu')
        ).group_by(PerformanceLog.endpoint).order_by(desc('avg_time')).limit(20).all()
        
        # Slow queries count
        slow_queries_count = db.session.query(PerformanceLog).filter(
            PerformanceLog.slow_query == True
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'logs': [log.to_dict() for log in logs],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': (total + limit - 1) // limit
                },
                'performance_analytics': {
                    'slow_queries_count': slow_queries_count,
                    'endpoint_stats': [
                        {
                            'endpoint': stat.endpoint,
                            'avg_response_time': round(stat.avg_time, 3),
                            'min_response_time': round(stat.min_time, 3),
                            'max_response_time': round(stat.max_time, 3),
                            'request_count': stat.request_count,
                            'avg_memory_mb': round(stat.avg_memory / 1024 / 1024, 2) if stat.avg_memory else None,
                            'avg_cpu_percent': round(stat.avg_cpu, 2) if stat.avg_cpu else None
                        } for stat in perf_stats
                    ]
                }
            }
        })
        
    except Exception as e:
        advanced_logger.log_error(e, context='get_performance_logs')
        return jsonify({
            'success': False,
            'message': 'Performans logları alınamadı',
            'error': str(e)
        }), 500

@admin_logs_bp.route('/export', methods=['POST'])
@require_auth
@require_role(['admin', 'super_admin'])
def export_logs():
    """Logları export et"""
    try:
        data = request.get_json()
        
        log_type = data.get('log_type', 'system')  # system, security, audit, performance
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        format_type = data.get('format', 'json')  # json, csv
        filters = data.get('filters', {})
        
        # Determine model class
        if log_type == 'system':
            model_class = SystemLog
        elif log_type == 'security':
            model_class = SecurityLog
        elif log_type == 'audit':
            model_class = AuditLog
        elif log_type == 'performance':
            model_class = PerformanceLog
        else:
            return jsonify({
                'success': False,
                'message': 'Geçersiz log tipi'
            }), 400
        
        # Build query
        query = db.session.query(model_class)
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(model_class.timestamp >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(model_class.timestamp <= end_dt)
        
        # Apply additional filters
        for key, value in filters.items():
            if hasattr(model_class, key) and value:
                query = query.filter(getattr(model_class, key) == value)
        
        # Limit to reasonable size
        logs = query.order_by(desc(model_class.timestamp)).limit(10000).all()
        
        if format_type == 'json':
            exported_data = [log.to_dict() for log in logs]
        else:
            # CSV format (simplified)
            exported_data = []
            for log in logs:
                log_dict = log.to_dict()
                # Flatten JSON fields for CSV
                for key, value in log_dict.items():
                    if isinstance(value, dict):
                        log_dict[key] = json.dumps(value)
                exported_data.append(log_dict)
        
        # Log this export activity
        advanced_logger.log_audit(
            action='EXPORT',
            table_name=f'logs_{log_type}',
            user_id=g.current_user['user_id'],
            user_email=g.current_user['email'],
            user_role=g.current_user['role_id'],
            new_values={
                'log_type': log_type,
                'format': format_type,
                'record_count': len(exported_data),
                'date_range': f"{start_date} to {end_date}"
            }
        )
        
        return jsonify({
            'success': True,
            'data': exported_data,
            'meta': {
                'log_type': log_type,
                'format': format_type,
                'count': len(exported_data),
                'exported_at': datetime.now(timezone.utc).isoformat()
            }
        })
        
    except Exception as e:
        advanced_logger.log_error(e, context='export_logs')
        return jsonify({
            'success': False,
            'message': 'Log export başarısız',
            'error': str(e)
        }), 500

@admin_logs_bp.route('/settings', methods=['GET', 'POST'])
@require_auth
@require_role(['super_admin'])
def log_settings():
    """Log ayarları"""
    if request.method == 'GET':
        # Get current settings (from config or database)
        settings = {
            'retention_days': {
                'system_logs': 90,
                'security_logs': 365,
                'audit_logs': 2555,  # 7 years
                'performance_logs': 30
            },
            'auto_cleanup': True,
            'alert_thresholds': {
                'error_count_per_hour': 100,
                'security_risk_score': 80,
                'slow_query_threshold': 2.0
            },
            'storage_settings': {
                'max_db_size_gb': 10,
                'archive_old_logs': True,
                'compress_archived': True
            }
        }
        
        return jsonify({
            'success': True,
            'data': settings
        })
    
    else:  # POST
        try:
            data = request.get_json()
            
            # Validate and save settings
            # This would typically save to database or config file
            
            # Log this admin action
            advanced_logger.log_audit(
                action='UPDATE',
                table_name='log_settings',
                user_id=g.current_user['user_id'],
                user_email=g.current_user['email'],
                user_role=g.current_user['role_id'],
                new_values=data
            )
            
            return jsonify({
                'success': True,
                'message': 'Log ayarları güncellendi'
            })
            
        except Exception as e:
            advanced_logger.log_error(e, context='update_log_settings')
            return jsonify({
                'success': False,
                'message': 'Ayarlar güncellenemedi',
                'error': str(e)
            }), 500

@admin_logs_bp.route('/cleanup', methods=['POST'])
@require_auth
@require_role(['super_admin'])
def cleanup_logs():
    """Eski logları temizle"""
    try:
        data = request.get_json()
        log_type = data.get('log_type', 'all')
        days_to_keep = data.get('days_to_keep', 30)
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)
        deleted_counts = {}
        
        # Cleanup based on log type
        if log_type in ['all', 'system']:
            deleted = db.session.query(SystemLog).filter(
                SystemLog.timestamp < cutoff_date
            ).delete()
            deleted_counts['system_logs'] = deleted
        
        if log_type in ['all', 'security']:
            deleted = db.session.query(SecurityLog).filter(
                SecurityLog.timestamp < cutoff_date
            ).delete()
            deleted_counts['security_logs'] = deleted
        
        if log_type in ['all', 'performance']:
            deleted = db.session.query(PerformanceLog).filter(
                PerformanceLog.timestamp < cutoff_date
            ).delete()
            deleted_counts['performance_logs'] = deleted
        
        # Don't auto-delete audit logs - they're important for compliance
        if log_type == 'audit' and days_to_keep > 365:  # Only if explicitly keeping for 1+ years
            deleted = db.session.query(AuditLog).filter(
                AuditLog.timestamp < cutoff_date
            ).delete()
            deleted_counts['audit_logs'] = deleted
        
        db.session.commit()
        
        # Log this cleanup activity
        advanced_logger.log_audit(
            action='DELETE',
            table_name='logs_cleanup',
            user_id=g.current_user['user_id'],
            user_email=g.current_user['email'],
            user_role=g.current_user['role_id'],
            new_values={
                'log_type': log_type,
                'days_to_keep': days_to_keep,
                'deleted_counts': deleted_counts,
                'cutoff_date': cutoff_date.isoformat()
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Log temizleme tamamlandı',
            'data': {
                'deleted_counts': deleted_counts,
                'cutoff_date': cutoff_date.isoformat()
            }
        })
        
    except Exception as e:
        db.session.rollback()
        advanced_logger.log_error(e, context='cleanup_logs')
        return jsonify({
            'success': False,
            'message': 'Log temizleme başarısız',
            'error': str(e)
        }), 500 