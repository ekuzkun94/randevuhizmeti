from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone, date
from models.models import db, Activity, User
from utils.validators import validate_required_fields
from utils.logger import log_request, log_error
import uuid

activities_bp = Blueprint('activities', __name__)

@activities_bp.route('/activities', methods=['GET'])
@jwt_required()
@log_request
def get_activities():
    """Kullanıcının aktivitelerini listele"""
    try:
        current_user_id = get_jwt_identity()
        
        # Query parametreleri
        category = request.args.get('category')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        
        # Base query
        query = Activity.query.filter_by(user_id=current_user_id)
        
        if category:
            query = query.filter_by(category=category)
        
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(Activity.date >= start_dt)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Geçersiz başlangıç tarihi formatı'
                }), 400
        
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()
                query = query.filter(Activity.date <= end_dt)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Geçersiz bitiş tarihi formatı'
                }), 400
        
        if status:
            query = query.filter_by(status=status)
        
        activities = query.order_by(Activity.date.desc()).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': [activity.to_dict() for activity in activities],
            'count': len(activities)
        }), 200
        
    except Exception as e:
        log_error(f"Activities list error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Aktiviteler listelenirken hata oluştu'
        }), 500

@activities_bp.route('/activities', methods=['POST'])
@jwt_required()
@log_request
def create_activity():
    """Yeni aktivite kaydı oluştur"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Zorunlu alanları kontrol et
        required_fields = ['name', 'date']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return validation_error
        
        # Tarih formatını kontrol et
        try:
            activity_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Geçersiz tarih formatı (YYYY-MM-DD)'
            }), 400
        
        # Zaman formatlarını kontrol et
        start_time = None
        end_time = None
        
        if data.get('start_time'):
            try:
                start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Geçersiz başlangıç zamanı formatı'
                }), 400
        
        if data.get('end_time'):
            try:
                end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Geçersiz bitiş zamanı formatı'
                }), 400
        
        # Süre hesaplama
        duration_minutes = data.get('duration_minutes')
        if start_time and end_time and not duration_minutes:
            duration_minutes = int((end_time - start_time).total_seconds() / 60)
        
        # Yeni aktivite oluştur
        activity = Activity(
            id=str(uuid.uuid4()),
            user_id=current_user_id,
            business_id=data.get('business_id'),
            name=data['name'],
            category=data.get('category'),
            description=data.get('description'),
            date=activity_date,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            calories_burned=data.get('calories_burned'),
            steps=data.get('steps'),
            distance_km=data.get('distance_km'),
            heart_rate_avg=data.get('heart_rate_avg'),
            status=data.get('status', 'completed'),
            energy_level=data.get('energy_level'),
            mood_rating=data.get('mood_rating'),
            notes=data.get('notes')
        )
        
        activity.save()
        
        return jsonify({
            'success': True,
            'message': 'Aktivite kaydı başarıyla oluşturuldu',
            'data': activity.to_dict()
        }), 201
        
    except Exception as e:
        log_error(f"Activity creation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Aktivite kaydı oluşturulurken hata oluştu'
        }), 500

@activities_bp.route('/activities/statistics', methods=['GET'])
@jwt_required()
@log_request
def get_activity_statistics():
    """Aktivite istatistiklerini getir"""
    try:
        current_user_id = get_jwt_identity()
        
        # Son 30 gün
        from datetime import timedelta
        thirty_days_ago = datetime.now().date() - timedelta(days=30)
        
        activities = Activity.query.filter(
            Activity.user_id == current_user_id,
            Activity.date >= thirty_days_ago
        ).all()
        
        statistics = {
            'total_activities': len(activities),
            'total_calories': 0,
            'total_steps': 0,
            'total_distance': 0,
            'total_duration': 0,
            'average_energy': 0,
            'average_mood': 0,
            'categories': {},
            'weekly_summary': []
        }
        
        total_energy = 0
        total_mood = 0
        energy_count = 0
        mood_count = 0
        
        for activity in activities:
            # Toplamlar
            if activity.calories_burned:
                statistics['total_calories'] += activity.calories_burned
            if activity.steps:
                statistics['total_steps'] += activity.steps
            if activity.distance_km:
                statistics['total_distance'] += activity.distance_km
            if activity.duration_minutes:
                statistics['total_duration'] += activity.duration_minutes
            
            # Ortalamalar
            if activity.energy_level:
                total_energy += activity.energy_level
                energy_count += 1
            if activity.mood_rating:
                total_mood += activity.mood_rating
                mood_count += 1
            
            # Kategori bazında grupla
            category = activity.category or 'other'
            if category not in statistics['categories']:
                statistics['categories'][category] = 0
            statistics['categories'][category] += 1
        
        if energy_count > 0:
            statistics['average_energy'] = total_energy / energy_count
        if mood_count > 0:
            statistics['average_mood'] = total_mood / mood_count
        
        return jsonify({
            'success': True,
            'data': statistics
        }), 200
        
    except Exception as e:
        log_error(f"Activity statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Aktivite istatistikleri alınırken hata oluştu'
        }), 500
