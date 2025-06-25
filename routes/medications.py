from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone, date
from models.models import db, Medication, MedicationLog, User
from utils.validators import validate_required_fields
from utils.security import require_role
from utils.logger import log_request, log_error
import json
import uuid

medications_bp = Blueprint('medications', __name__)

@medications_bp.route('/medications', methods=['GET'])
@jwt_required()
@log_request
def get_medications():
    """Kullanıcının ilaçlarını listele"""
    try:
        current_user_id = get_jwt_identity()
        
        # Query parametreleri
        business_id = request.args.get('business_id')
        is_active = request.args.get('is_active', 'true').lower() == 'true'
        
        # Base query
        query = Medication.query.filter_by(user_id=current_user_id)
        
        if business_id:
            query = query.filter_by(business_id=business_id)
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        medications = query.order_by(Medication.created_at.desc()).all()
        
        # İlaç listesini oluştur
        result = []
        for med in medications:
            med_dict = med.to_dict()
            
            # Times alanını parse et
            if med.times:
                try:
                    med_dict['times'] = json.loads(med.times)
                except json.JSONDecodeError:
                    med_dict['times'] = []
            else:
                med_dict['times'] = []
            
            # Son alım durumunu ekle
            latest_log = MedicationLog.query.filter_by(
                medication_id=med.id
            ).order_by(MedicationLog.scheduled_time.desc()).first()
            
            if latest_log:
                med_dict['last_taken'] = {
                    'scheduled_time': latest_log.scheduled_time.isoformat(),
                    'taken_time': latest_log.taken_time.isoformat() if latest_log.taken_time else None,
                    'status': latest_log.status,
                    'delay_minutes': latest_log.delay_minutes
                }
            else:
                med_dict['last_taken'] = None
            
            result.append(med_dict)
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        log_error(f"Medications list error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İlaçlar listelenirken hata oluştu'
        }), 500

@medications_bp.route('/medications', methods=['POST'])
@jwt_required()
@log_request
def create_medication():
    """Yeni ilaç kaydı oluştur"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Zorunlu alanları kontrol et
        required_fields = ['name', 'frequency', 'start_date']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return validation_error
        
        # Times alanını JSON string olarak kaydet
        times_json = None
        if 'times' in data and data['times']:
            times_json = json.dumps(data['times'])
        
        # Tarih formatını kontrol et
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Geçersiz başlangıç tarihi formatı (YYYY-MM-DD)'
            }), 400
        
        end_date = None
        if data.get('end_date'):
            try:
                end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Geçersiz bitiş tarihi formatı (YYYY-MM-DD)'
                }), 400
        
        # Yeni ilaç oluştur
        medication = Medication(
            id=str(uuid.uuid4()),
            user_id=current_user_id,
            business_id=data.get('business_id'),
            name=data['name'],
            dosage=data.get('dosage'),
            frequency=data['frequency'],
            instructions=data.get('instructions'),
            start_date=start_date,
            end_date=end_date,
            times=times_json,
            notes=data.get('notes')
        )
        
        medication.save()
        
        return jsonify({
            'success': True,
            'message': 'İlaç kaydı başarıyla oluşturuldu',
            'data': medication.to_dict()
        }), 201
        
    except Exception as e:
        log_error(f"Medication creation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İlaç kaydı oluşturulurken hata oluştu'
        }), 500

@medications_bp.route('/medications/<medication_id>', methods=['PUT'])
@jwt_required()
@log_request
def update_medication(medication_id):
    """İlaç kaydını güncelle"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # İlacı bul
        medication = Medication.query.filter_by(
            id=medication_id,
            user_id=current_user_id
        ).first()
        
        if not medication:
            return jsonify({
                'success': False,
                'message': 'İlaç kaydı bulunamadı'
            }), 404
        
        # Güncellenebilir alanları kontrol et
        updatable_fields = [
            'name', 'dosage', 'frequency', 'instructions',
            'start_date', 'end_date', 'times', 'is_active', 'notes'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'times' and data[field]:
                    # Times alanını JSON string olarak kaydet
                    setattr(medication, field, json.dumps(data[field]))
                elif field in ['start_date', 'end_date'] and data[field]:
                    # Tarih formatını kontrol et
                    try:
                        date_obj = datetime.strptime(data[field], '%Y-%m-%d').date()
                        setattr(medication, field, date_obj)
                    except ValueError:
                        return jsonify({
                            'success': False,
                            'message': f'Geçersiz {field} formatı (YYYY-MM-DD)'
                        }), 400
                else:
                    setattr(medication, field, data[field])
        
        medication.save()
        
        return jsonify({
            'success': True,
            'message': 'İlaç kaydı başarıyla güncellendi',
            'data': medication.to_dict()
        }), 200
        
    except Exception as e:
        log_error(f"Medication update error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İlaç kaydı güncellenirken hata oluştu'
        }), 500

@medications_bp.route('/medications/<medication_id>', methods=['DELETE'])
@jwt_required()
@log_request
def delete_medication(medication_id):
    """İlaç kaydını sil"""
    try:
        current_user_id = get_jwt_identity()
        
        # İlacı bul
        medication = Medication.query.filter_by(
            id=medication_id,
            user_id=current_user_id
        ).first()
        
        if not medication:
            return jsonify({
                'success': False,
                'message': 'İlaç kaydı bulunamadı'
            }), 404
        
        medication.delete()
        
        return jsonify({
            'success': True,
            'message': 'İlaç kaydı başarıyla silindi'
        }), 200
        
    except Exception as e:
        log_error(f"Medication deletion error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İlaç kaydı silinirken hata oluştu'
        }), 500

@medications_bp.route('/medications/<medication_id>/log', methods=['POST'])
@jwt_required()
@log_request
def log_medication_taken(medication_id):
    """İlaç alım kaydı oluştur"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # İlacı kontrol et
        medication = Medication.query.filter_by(
            id=medication_id,
            user_id=current_user_id
        ).first()
        
        if not medication:
            return jsonify({
                'success': False,
                'message': 'İlaç kaydı bulunamadı'
            }), 404
        
        # Zorunlu alanları kontrol et
        required_fields = ['scheduled_time', 'status']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return validation_error
        
        # Zamanları parse et
        try:
            scheduled_time = datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Geçersiz planlanan zaman formatı'
            }), 400
        
        taken_time = None
        if data.get('taken_time'):
            try:
                taken_time = datetime.fromisoformat(data['taken_time'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Geçersiz alınan zaman formatı'
                }), 400
        
        # Gecikme hesapla
        delay_minutes = 0
        if taken_time and scheduled_time:
            delay_minutes = int((taken_time - scheduled_time).total_seconds() / 60)
        
        # Log kaydı oluştur
        medication_log = MedicationLog(
            id=str(uuid.uuid4()),
            medication_id=medication_id,
            user_id=current_user_id,
            scheduled_time=scheduled_time,
            taken_time=taken_time,
            status=data['status'],
            delay_minutes=delay_minutes,
            notes=data.get('notes')
        )
        
        medication_log.save()
        
        # Adherence rate'i güncelle
        total_logs = MedicationLog.query.filter_by(medication_id=medication_id).count()
        taken_logs = MedicationLog.query.filter_by(
            medication_id=medication_id,
            status='taken'
        ).count()
        
        if total_logs > 0:
            adherence_rate = (taken_logs / total_logs) * 100
            medication.adherence_rate = adherence_rate
            medication.save()
        
        return jsonify({
            'success': True,
            'message': 'İlaç alım kaydı başarıyla oluşturuldu',
            'data': medication_log.to_dict()
        }), 201
        
    except Exception as e:
        log_error(f"Medication log error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İlaç alım kaydı oluşturulurken hata oluştu'
        }), 500

@medications_bp.route('/medications/<medication_id>/logs', methods=['GET'])
@jwt_required()
@log_request
def get_medication_logs(medication_id):
    """İlaç alım kayıtlarını listele"""
    try:
        current_user_id = get_jwt_identity()
        
        # İlacı kontrol et
        medication = Medication.query.filter_by(
            id=medication_id,
            user_id=current_user_id
        ).first()
        
        if not medication:
            return jsonify({
                'success': False,
                'message': 'İlaç kaydı bulunamadı'
            }), 404
        
        # Query parametreleri
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        
        # Base query
        query = MedicationLog.query.filter_by(medication_id=medication_id)
        
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(MedicationLog.scheduled_time >= start_dt)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Geçersiz başlangıç tarihi formatı'
                }), 400
        
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, '%Y-%m-%d')
                query = query.filter(MedicationLog.scheduled_time <= end_dt)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Geçersiz bitiş tarihi formatı'
                }), 400
        
        if status:
            query = query.filter_by(status=status)
        
        logs = query.order_by(
            MedicationLog.scheduled_time.desc()
        ).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': [log.to_dict() for log in logs],
            'count': len(logs)
        }), 200
        
    except Exception as e:
        log_error(f"Medication logs error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İlaç alım kayıtları listelenirken hata oluştu'
        }), 500

@medications_bp.route('/medications/statistics', methods=['GET'])
@jwt_required()
@log_request
def get_medication_statistics():
    """İlaç adherence istatistiklerini getir"""
    try:
        current_user_id = get_jwt_identity()
        
        # Aktif ilaçları getir
        medications = Medication.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).all()
        
        statistics = {
            'total_medications': len(medications),
            'average_adherence': 0,
            'medications_detail': []
        }
        
        total_adherence = 0
        
        for medication in medications:
            med_stats = {
                'id': medication.id,
                'name': medication.name,
                'adherence_rate': medication.adherence_rate,
            }
            
            statistics['medications_detail'].append(med_stats)
            total_adherence += medication.adherence_rate
        
        if len(medications) > 0:
            statistics['average_adherence'] = total_adherence / len(medications)
        
        return jsonify({
            'success': True,
            'data': statistics
        }), 200
        
    except Exception as e:
        log_error(f"Medication statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'İlaç istatistikleri alınırken hata oluştu'
        }), 500 