from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from models.models import db, Task, User
from utils.validators import validate_required_fields
from utils.logger import log_request, log_error
import json
import uuid

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/tasks', methods=['GET'])
@jwt_required()
@log_request
def get_tasks():
    """Kullanıcının görevlerini listele"""
    try:
        current_user_id = get_jwt_identity()
        
        # Query parametreleri
        status = request.args.get('status')
        category = request.args.get('category')
        priority = request.args.get('priority')
        project = request.args.get('project')
        parent_task_id = request.args.get('parent_task_id')
        limit = int(request.args.get('limit', 50))
        
        # Base query
        query = Task.query.filter_by(user_id=current_user_id)
        
        if status:
            query = query.filter_by(status=status)
        if category:
            query = query.filter_by(category=category)
        if priority:
            query = query.filter_by(priority=priority)
        if project:
            query = query.filter_by(project=project)
        if parent_task_id:
            query = query.filter_by(parent_task_id=parent_task_id)
        
        tasks = query.order_by(Task.created_at.desc()).limit(limit).all()
        
        # Görev listesini oluştur
        result = []
        for task in tasks:
            task_dict = task.to_dict()
            
            # Tags alanını parse et
            if task.tags:
                try:
                    task_dict['tags'] = json.loads(task.tags)
                except json.JSONDecodeError:
                    task_dict['tags'] = []
            else:
                task_dict['tags'] = []
            
            # Alt görevleri ekle
            subtasks = Task.query.filter_by(parent_task_id=task.id).all()
            task_dict['subtasks_count'] = len(subtasks)
            
            result.append(task_dict)
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        log_error(f"Tasks list error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Görevler listelenirken hata oluştu'
        }), 500

@tasks_bp.route('/tasks', methods=['POST'])
@jwt_required()
@log_request
def create_task():
    """Yeni görev oluştur"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Zorunlu alanları kontrol et
        required_fields = ['title']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return validation_error
        
        # Due date formatını kontrol et
        due_date = None
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Geçersiz bitiş tarihi formatı'
                }), 400
        
        # Tags alanını JSON string olarak kaydet
        tags_json = None
        if 'tags' in data and data['tags']:
            tags_json = json.dumps(data['tags'])
        
        # Yeni görev oluştur
        task = Task(
            id=str(uuid.uuid4()),
            user_id=current_user_id,
            business_id=data.get('business_id'),
            title=data['title'],
            description=data.get('description'),
            category=data.get('category'),
            priority=data.get('priority', 'medium'),
            due_date=due_date,
            estimated_duration=data.get('estimated_duration'),
            parent_task_id=data.get('parent_task_id'),
            project=data.get('project'),
            tags=tags_json,
            status=data.get('status', 'todo'),
            completion_rate=data.get('completion_rate', 0)
        )
        
        task.save()
        
        return jsonify({
            'success': True,
            'message': 'Görev başarıyla oluşturuldu',
            'data': task.to_dict()
        }), 201
        
    except Exception as e:
        log_error(f"Task creation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Görev oluşturulurken hata oluştu'
        }), 500

@tasks_bp.route('/tasks/<task_id>', methods=['PUT'])
@jwt_required()
@log_request
def update_task(task_id):
    """Görevi güncelle"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Görevi bul
        task = Task.query.filter_by(
            id=task_id,
            user_id=current_user_id
        ).first()
        
        if not task:
            return jsonify({
                'success': False,
                'message': 'Görev bulunamadı'
            }), 404
        
        # Güncellenebilir alanları kontrol et
        updatable_fields = [
            'title', 'description', 'category', 'priority', 'due_date',
            'estimated_duration', 'actual_duration', 'project', 'tags',
            'status', 'completion_rate'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'tags' and data[field]:
                    # Tags alanını JSON string olarak kaydet
                    setattr(task, field, json.dumps(data[field]))
                elif field == 'due_date' and data[field]:
                    # Tarih formatını kontrol et
                    try:
                        due_date = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                        setattr(task, field, due_date)
                    except ValueError:
                        return jsonify({
                            'success': False,
                            'message': 'Geçersiz bitiş tarihi formatı'
                        }), 400
                else:
                    setattr(task, field, data[field])
        
        # Status güncellemesi: completed ise completion time'ı ayarla
        if data.get('status') == 'completed' and not task.completed_at:
            task.completed_at = datetime.now(timezone.utc)
            task.completion_rate = 100
        
        task.save()
        
        return jsonify({
            'success': True,
            'message': 'Görev başarıyla güncellendi',
            'data': task.to_dict()
        }), 200
        
    except Exception as e:
        log_error(f"Task update error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Görev güncellenirken hata oluştu'
        }), 500

@tasks_bp.route('/tasks/statistics', methods=['GET'])
@jwt_required()
@log_request
def get_task_statistics():
    """Görev istatistiklerini getir"""
    try:
        current_user_id = get_jwt_identity()
        
        # Tüm görevleri getir
        tasks = Task.query.filter_by(user_id=current_user_id).all()
        
        statistics = {
            'total_tasks': len(tasks),
            'by_status': {
                'todo': 0,
                'in_progress': 0,
                'completed': 0,
                'cancelled': 0,
                'deferred': 0
            },
            'by_priority': {
                'low': 0,
                'medium': 0,
                'high': 0,
                'urgent': 0
            },
            'by_category': {},
            'completion_rate': 0,
            'overdue_tasks': 0,
            'today_tasks': 0
        }
        
        completed_tasks = 0
        today = datetime.now().date()
        
        for task in tasks:
            # Status bazında
            if task.status in statistics['by_status']:
                statistics['by_status'][task.status] += 1
            
            # Priority bazında
            if task.priority in statistics['by_priority']:
                statistics['by_priority'][task.priority] += 1
            
            # Category bazında
            category = task.category or 'other'
            if category not in statistics['by_category']:
                statistics['by_category'][category] = 0
            statistics['by_category'][category] += 1
            
            # Completion rate
            if task.status == 'completed':
                completed_tasks += 1
            
            # Overdue tasks
            if task.due_date and task.due_date.date() < today and task.status != 'completed':
                statistics['overdue_tasks'] += 1
            
            # Today's tasks
            if task.due_date and task.due_date.date() == today:
                statistics['today_tasks'] += 1
        
        if len(tasks) > 0:
            statistics['completion_rate'] = (completed_tasks / len(tasks)) * 100
        
        return jsonify({
            'success': True,
            'data': statistics
        }), 200
        
    except Exception as e:
        log_error(f"Task statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Görev istatistikleri alınırken hata oluştu'
        }), 500
