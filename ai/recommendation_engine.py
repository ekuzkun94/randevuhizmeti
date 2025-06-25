from datetime import datetime, timezone, timedelta
from models.models import (
    db, User, Appointment, Task, Activity, Medication, 
    UserBehavior, AIRecommendation
)
from typing import List, Dict, Any, Optional
import json
import uuid
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """AI Öneri Motoru - Kullanıcı davranışlarını analiz ederek öneriler üretir"""
    
    def __init__(self):
        self.confidence_threshold = 0.7
        self.max_recommendations = 10
    
    def generate_recommendations(self, user_id: str) -> List[Dict[str, Any]]:
        """Kullanıcı için kişiselleştirilmiş öneriler üret"""
        try:
            recommendations = []
            
            # Kullanıcıyı al
            user = User.query.get(user_id)
            if not user:
                return []
            
            # Farklı kategorilerde öneriler üret
            recommendations.extend(self._generate_time_optimization_recommendations(user_id))
            recommendations.extend(self._generate_health_recommendations(user_id))
            recommendations.extend(self._generate_task_scheduling_recommendations(user_id))
            recommendations.extend(self._generate_appointment_recommendations(user_id))
            
            # Confidence score'a göre sırala
            recommendations.sort(key=lambda x: x.get('confidence_score', 0), reverse=True)
            
            # En iyi önerileri seç ve kaydet
            top_recommendations = recommendations[:self.max_recommendations]
            self._save_recommendations(user_id, top_recommendations)
            
            return top_recommendations
            
        except Exception as e:
            logger.error(f"Recommendation generation error for user {user_id}: {str(e)}")
            return []
    
    def _generate_time_optimization_recommendations(self, user_id: str) -> List[Dict[str, Any]]:
        """Zaman optimizasyonu önerileri"""
        recommendations = []
        
        try:
            # Son 30 günün verilerini analiz et
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            # Kullanıcının en aktif olduğu saatleri bul
            behaviors = UserBehavior.query.filter(
                UserBehavior.user_id == user_id,
                UserBehavior.timestamp >= thirty_days_ago
            ).all()
            
            hour_activity = defaultdict(int)
            for behavior in behaviors:
                hour = behavior.hour_of_day
                if hour is not None:
                    hour_activity[hour] += 1
            
            if hour_activity:
                # En aktif saatleri bul
                peak_hours = sorted(hour_activity.items(), key=lambda x: x[1], reverse=True)[:3]
                
                for hour, activity_count in peak_hours:
                    if activity_count >= 5:  # Yeterli veri varsa
                        time_slot = self._get_time_slot_name(hour)
                        recommendations.append({
                            'type': 'time_optimization',
                            'title': f'{time_slot} Saatlerinde Daha Produktif',
                            'description': f'Verilerinize göre {time_slot} saatleri ({hour:02d}:00-{hour+1:02d}:00) en aktif olduğunuz zaman. Önemli görevlerinizi bu saatlere planlayın.',
                            'confidence_score': min(0.9, activity_count / 20),
                            'impact_score': 0.8,
                            'priority': 'high' if activity_count >= 10 else 'medium',
                            'action_data': json.dumps({
                                'optimal_hour': hour,
                                'activity_level': activity_count,
                                'suggestion': f'schedule_tasks_at_{hour}'
                            })
                        })
            
            # Görev tamamlama patterlerini analiz et
            completed_tasks = Task.query.filter(
                Task.user_id == user_id,
                Task.status == 'completed',
                Task.completed_at >= thirty_days_ago
            ).all()
            
            if len(completed_tasks) >= 5:
                # Ortalama görev süresi
                total_duration = sum(task.actual_duration or task.estimated_duration or 60 
                                   for task in completed_tasks if task.actual_duration or task.estimated_duration)
                avg_duration = total_duration / len(completed_tasks)
                
                recommendations.append({
                    'type': 'time_optimization',
                    'title': 'Görev Süre Tahmini Optimize Edilebilir',
                    'description': f'Görevleriniz ortalama {avg_duration:.0f} dakika sürüyor. Gelecek görevleriniz için bu süreyi referans alabilirsiniz.',
                    'confidence_score': 0.75,
                    'impact_score': 0.6,
                    'priority': 'medium',
                    'action_data': json.dumps({
                        'average_duration': avg_duration,
                        'completed_tasks_count': len(completed_tasks)
                    })
                })
            
        except Exception as e:
            logger.error(f"Time optimization recommendations error: {str(e)}")
        
        return recommendations
    
    def _generate_health_recommendations(self, user_id: str) -> List[Dict[str, Any]]:
        """Sağlık ve ilaç önerileri"""
        recommendations = []
        
        try:
            # İlaç adherence analizi
            medications = Medication.query.filter_by(
                user_id=user_id,
                is_active=True
            ).all()
            
            for medication in medications:
                if medication.adherence_rate < 80:  # %80'in altındaysa
                    recommendations.append({
                        'type': 'health_reminder',
                        'title': f'{medication.name} İlaç Uyumu Düşük',
                        'description': f'{medication.name} ilacınızın uyum oranı %{medication.adherence_rate:.0f}. Hatırlatıcıları aktifleştirin.',
                        'confidence_score': 0.9,
                        'impact_score': 0.95,
                        'priority': 'high',
                        'action_data': json.dumps({
                            'medication_id': medication.id,
                            'current_adherence': medication.adherence_rate,
                            'suggestion': 'enable_reminders'
                        })
                    })
                elif medication.adherence_rate > 95:  # Çok iyi performans
                    recommendations.append({
                        'type': 'health_positive',
                        'title': f'{medication.name} İlaç Uyumu Mükemmel!',
                        'description': f'{medication.name} ilacında %{medication.adherence_rate:.0f} uyum oranı. Harika gidiyorsunuz!',
                        'confidence_score': 0.8,
                        'impact_score': 0.5,
                        'priority': 'low',
                        'action_data': json.dumps({
                            'medication_id': medication.id,
                            'current_adherence': medication.adherence_rate
                        })
                    })
            
            # Aktivite analizi
            seven_days_ago = datetime.now().date() - timedelta(days=7)
            recent_activities = Activity.query.filter(
                Activity.user_id == user_id,
                Activity.date >= seven_days_ago
            ).all()
            
            if len(recent_activities) == 0:
                recommendations.append({
                    'type': 'health_reminder',
                    'title': 'Aktivite Kaydı Eksik',
                    'description': 'Son 7 günde hiç aktivite kaydınız yok. Günlük egzersiz rutininizi kaydetmeye başlayın.',
                    'confidence_score': 0.8,
                    'impact_score': 0.7,
                    'priority': 'medium',
                    'action_data': json.dumps({
                        'suggestion': 'start_activity_tracking',
                        'days_since_last': 7
                    })
                })
            elif len(recent_activities) >= 5:
                total_calories = sum(act.calories_burned or 0 for act in recent_activities)
                recommendations.append({
                    'type': 'health_positive',
                    'title': 'Aktif Bir Hafta Geçirdiniz!',
                    'description': f'Son 7 günde {len(recent_activities)} aktivite ve toplam {total_calories} kalori yaktınız. Devam edin!',
                    'confidence_score': 0.9,
                    'impact_score': 0.6,
                    'priority': 'low',
                    'action_data': json.dumps({
                        'activities_count': len(recent_activities),
                        'total_calories': total_calories
                    })
                })
            
        except Exception as e:
            logger.error(f"Health recommendations error: {str(e)}")
        
        return recommendations
    
    def _generate_task_scheduling_recommendations(self, user_id: str) -> List[Dict[str, Any]]:
        """Görev planlama önerileri"""
        recommendations = []
        
        try:
            # Tamamlanmamış görevleri analiz et
            pending_tasks = Task.query.filter(
                Task.user_id == user_id,
                Task.status.in_(['todo', 'in_progress'])
            ).all()
            
            overdue_tasks = [task for task in pending_tasks 
                           if task.due_date and task.due_date < datetime.now()]
            
            if len(overdue_tasks) > 0:
                recommendations.append({
                    'type': 'task_scheduling',
                    'title': f'{len(overdue_tasks)} Görev Gecikmiş',
                    'description': f'{len(overdue_tasks)} göreviniz teslim tarihini geçmiş. Öncelik sırasını gözden geçirin.',
                    'confidence_score': 1.0,
                    'impact_score': 0.9,
                    'priority': 'urgent',
                    'action_data': json.dumps({
                        'overdue_count': len(overdue_tasks),
                        'overdue_task_ids': [task.id for task in overdue_tasks]
                    })
                })
            
            # Bugün yapılacak görevler
            today = datetime.now().date()
            today_tasks = [task for task in pending_tasks 
                          if task.due_date and task.due_date.date() == today]
            
            if len(today_tasks) > 5:
                recommendations.append({
                    'type': 'task_scheduling',
                    'title': 'Bugün Çok Fazla Görev Var',
                    'description': f'Bugün {len(today_tasks)} göreviniz var. Bazılarını yarına ertelemeyi düşünün.',
                    'confidence_score': 0.8,
                    'impact_score': 0.7,
                    'priority': 'medium',
                    'action_data': json.dumps({
                        'today_tasks_count': len(today_tasks),
                        'suggestion': 'reschedule_some_tasks'
                    })
                })
            
            # Görev kategorisi analizi
            category_counts = defaultdict(int)
            for task in pending_tasks:
                category = task.category or 'other'
                category_counts[category] += 1
            
            if category_counts:
                most_common_category = max(category_counts.items(), key=lambda x: x[1])
                if most_common_category[1] >= 3:
                    recommendations.append({
                        'type': 'task_scheduling',
                        'title': f'{most_common_category[0].title()} Kategorisinde Yoğunluk',
                        'description': f'{most_common_category[0]} kategorisinde {most_common_category[1]} göreviniz var. Toplu olarak ele alabilirsiniz.',
                        'confidence_score': 0.7,
                        'impact_score': 0.6,
                        'priority': 'medium',
                        'action_data': json.dumps({
                            'category': most_common_category[0],
                            'task_count': most_common_category[1],
                            'suggestion': 'batch_process_category'
                        })
                    })
            
        except Exception as e:
            logger.error(f"Task scheduling recommendations error: {str(e)}")
        
        return recommendations
    
    def _generate_appointment_recommendations(self, user_id: str) -> List[Dict[str, Any]]:
        """Randevu önerileri"""
        recommendations = []
        
        try:
            # Gelecek randevuları kontrol et
            upcoming_appointments = Appointment.query.filter(
                Appointment.customer_id == user_id,
                Appointment.appointment_date >= datetime.now().date(),
                Appointment.status == 'confirmed'
            ).all()
            
            if len(upcoming_appointments) == 0:
                # Son randevudan bu yana geçen süreyi hesapla
                last_appointment = Appointment.query.filter(
                    Appointment.customer_id == user_id,
                    Appointment.status == 'completed'
                ).order_by(Appointment.appointment_date.desc()).first()
                
                if last_appointment:
                    days_since_last = (datetime.now().date() - last_appointment.appointment_date).days
                    if days_since_last > 30:  # 30 günden fazla
                        recommendations.append({
                            'type': 'appointment_reminder',
                            'title': 'Randevu Zamanı Gelmiş Olabilir',
                            'description': f'Son randevunuzdan {days_since_last} gün geçti. Yeni bir randevu almanın zamanı gelebilir.',
                            'confidence_score': 0.7,
                            'impact_score': 0.8,
                            'priority': 'medium',
                            'action_data': json.dumps({
                                'days_since_last': days_since_last,
                                'last_service': last_appointment.service.name if last_appointment.service else 'N/A'
                            })
                        })
            
            # Yaklaşan randevular için hatırlatma
            tomorrow = datetime.now().date() + timedelta(days=1)
            tomorrow_appointments = [apt for apt in upcoming_appointments 
                                   if apt.appointment_date == tomorrow]
            
            if tomorrow_appointments:
                for appointment in tomorrow_appointments:
                    recommendations.append({
                        'type': 'appointment_reminder',
                        'title': 'Yarın Randevunuz Var',
                        'description': f'Yarın saat {appointment.appointment_time} randevunuz var. Hatırlatıcınızı kontrol edin.',
                        'confidence_score': 1.0,
                        'impact_score': 0.9,
                        'priority': 'high',
                        'action_data': json.dumps({
                            'appointment_id': appointment.id,
                            'appointment_time': appointment.appointment_time,
                            'service_name': appointment.service.name if appointment.service else 'N/A'
                        })
                    })
            
        except Exception as e:
            logger.error(f"Appointment recommendations error: {str(e)}")
        
        return recommendations
    
    def _get_time_slot_name(self, hour: int) -> str:
        """Saat dilimini Türkçe isim olarak döndür"""
        if 6 <= hour < 12:
            return "Sabah"
        elif 12 <= hour < 18:
            return "Öğleden Sonra"
        elif 18 <= hour < 22:
            return "Akşam"
        else:
            return "Gece"
    
    def _save_recommendations(self, user_id: str, recommendations: List[Dict[str, Any]]):
        """Önerileri veritabanına kaydet"""
        try:
            # Eski önerileri temizle
            old_recommendations = AIRecommendation.query.filter_by(user_id=user_id).all()
            for old_rec in old_recommendations:
                old_rec.delete()
            
            # Yeni önerileri kaydet
            for rec_data in recommendations:
                recommendation = AIRecommendation(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    type=rec_data['type'],
                    title=rec_data['title'],
                    description=rec_data['description'],
                    action_data=rec_data.get('action_data'),
                    confidence_score=rec_data.get('confidence_score', 0.5),
                    impact_score=rec_data.get('impact_score', 0.5),
                    priority=rec_data.get('priority', 'medium'),
                    expires_at=datetime.now(timezone.utc) + timedelta(days=7)  # 7 gün sonra expire
                )
                recommendation.save()
                
        except Exception as e:
            logger.error(f"Save recommendations error: {str(e)}")
    
    def track_user_behavior(self, user_id: str, action_type: str, action_data: Dict[str, Any] = None,
                           device_type: str = 'web', location: str = None):
        """Kullanıcı davranışını kaydet"""
        try:
            now = datetime.now(timezone.utc)
            
            behavior = UserBehavior(
                id=str(uuid.uuid4()),
                user_id=user_id,
                action_type=action_type,
                action_data=json.dumps(action_data) if action_data else None,
                timestamp=now,
                device_type=device_type,
                location=location,
                day_of_week=now.weekday(),
                hour_of_day=now.hour
            )
            
            behavior.save()
            
        except Exception as e:
            logger.error(f"Track behavior error: {str(e)}")
