#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from collections import defaultdict, Counter

class AIHelper:
    """Advanced AI system for customer recommendations and behavior analysis"""
    
    def __init__(self):
        # Simulated ML models for different AI features
        self.user_preferences = defaultdict(dict)
        self.behavior_patterns = defaultdict(list)
        self.service_ratings = defaultdict(list)
        self.appointment_history = defaultdict(list)
        
        # AI configuration
        self.recommendation_threshold = 0.7
        self.min_data_points = 3
        
    def log_user_behavior(self, user_id: str, action: str, data: Dict[str, Any]) -> None:
        """Log user behavior for AI learning"""
        behavior_entry = {
            'action': action,
            'data': data,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'session_id': data.get('session_id'),
            'device_info': data.get('device_info', {}),
            'location': data.get('location', {}),
        }
        
        self.behavior_patterns[user_id].append(behavior_entry)
        
        # Update user preferences based on behavior
        self._update_user_preferences(user_id, action, data)
    
    def _update_user_preferences(self, user_id: str, action: str, data: Dict[str, Any]) -> None:
        """Update user preferences based on their actions"""
        if action == 'appointment_created':
            service_id = data.get('service_id')
            provider_id = data.get('provider_id')
            time_preference = data.get('appointment_time', '').split(':')[0]
            
            # Track service preferences
            if service_id:
                self.user_preferences[user_id].setdefault('favorite_services', []).append(service_id)
            
            # Track provider preferences
            if provider_id:
                self.user_preferences[user_id].setdefault('favorite_providers', []).append(provider_id)
            
            # Track time preferences
            if time_preference:
                self.user_preferences[user_id].setdefault('time_preferences', []).append(int(time_preference))
        
        elif action == 'service_viewed':
            service_id = data.get('service_id')
            if service_id:
                self.user_preferences[user_id].setdefault('viewed_services', []).append(service_id)
        
        elif action == 'provider_viewed':
            provider_id = data.get('provider_id')
            if provider_id:
                self.user_preferences[user_id].setdefault('viewed_providers', []).append(provider_id)
    
    def get_service_recommendations(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get AI-powered service recommendations for user"""
        user_prefs = self.user_preferences.get(user_id, {})
        
        # Analyze user's service preferences
        favorite_services = user_prefs.get('favorite_services', [])
        viewed_services = user_prefs.get('viewed_services', [])
        
        # Create recommendation scores
        recommendations = []
        
        # Sample services (in real implementation, this would come from database)
        sample_services = [
            {'id': 'service-001', 'name': 'Saç Kesimi', 'category': 'beauty', 'price': 150.0, 'duration': 45},
            {'id': 'service-002', 'name': 'Makyaj', 'category': 'beauty', 'price': 300.0, 'duration': 60},
            {'id': 'service-003', 'name': 'Masaj', 'category': 'health', 'price': 400.0, 'duration': 90},
            {'id': 'service-004', 'name': 'Fitness Antrenmanı', 'category': 'fitness', 'price': 200.0, 'duration': 60},
            {'id': 'service-005', 'name': 'Cilt Bakımı', 'category': 'beauty', 'price': 250.0, 'duration': 75},
            {'id': 'service-006', 'name': 'Yoga Dersi', 'category': 'fitness', 'price': 120.0, 'duration': 60},
            {'id': 'service-007', 'name': 'Diyet Danışmanlığı', 'category': 'health', 'price': 180.0, 'duration': 45},
        ]
        
        for service in sample_services:
            score = self._calculate_service_score(user_id, service, favorite_services, viewed_services)
            if score >= self.recommendation_threshold:
                recommendations.append({
                    **service,
                    'recommendation_score': score,
                    'reason': self._get_recommendation_reason(user_id, service, score)
                })
        
        # Sort by recommendation score
        recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        return recommendations[:limit]
    
    def _calculate_service_score(self, user_id: str, service: Dict[str, Any], 
                                favorite_services: List[str], viewed_services: List[str]) -> float:
        """Calculate recommendation score for a service"""
        score = 0.5  # Base score
        
        # Boost score for frequently used services
        if service['id'] in favorite_services:
            score += 0.3 * (favorite_services.count(service['id']) / max(len(favorite_services), 1))
        
        # Boost score for viewed services
        if service['id'] in viewed_services:
            score += 0.2
        
        # Category-based scoring
        user_categories = [s.split('-')[0] for s in favorite_services if '-' in s]
        if service['category'] in user_categories:
            score += 0.25
        
        # Time-based scoring (boost popular services during certain hours)
        current_hour = datetime.now().hour
        if 9 <= current_hour <= 17:  # Business hours
            score += 0.1
        
        # Price preference scoring
        user_prefs = self.user_preferences.get(user_id, {})
        avg_price = user_prefs.get('average_price_range', 200.0)
        price_diff = abs(service['price'] - avg_price) / avg_price
        if price_diff <= 0.3:  # Within 30% of user's average
            score += 0.15
        
        return min(score, 1.0)
    
    def _get_recommendation_reason(self, user_id: str, service: Dict[str, Any], score: float) -> str:
        """Generate explanation for why this service is recommended"""
        reasons = []
        
        user_prefs = self.user_preferences.get(user_id, {})
        favorite_services = user_prefs.get('favorite_services', [])
        
        if service['id'] in favorite_services:
            reasons.append("Daha önce bu hizmeti kullandınız")
        
        if service['category'] == 'beauty' and any('beauty' in s for s in favorite_services):
            reasons.append("Güzellik hizmetlerini seviyorsunuz")
        
        if score >= 0.9:
            reasons.append("Size özel AI önerisi")
        elif score >= 0.8:
            reasons.append("Popüler seçim")
        else:
            reasons.append("İlginizi çekebilir")
        
        return " • ".join(reasons[:2])
    
    def get_provider_recommendations(self, user_id: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Get AI-powered provider recommendations"""
        user_prefs = self.user_preferences.get(user_id, {})
        favorite_providers = user_prefs.get('favorite_providers', [])
        
        # Sample providers with AI scoring
        sample_providers = [
            {'id': 'provider-001', 'name': 'Dr. Ahmet Yılmaz', 'specialization': 'Saç-Cilt', 'rating': 4.8, 'experience': 10},
            {'id': 'provider-002', 'name': 'Dr. Ayşe Kaya', 'specialization': 'Estetik', 'rating': 4.9, 'experience': 8},
            {'id': 'provider-003', 'name': 'Fitness Coach Ali', 'specialization': 'Spor', 'rating': 4.7, 'experience': 6},
            {'id': 'provider-004', 'name': 'Masöz Fatma', 'specialization': 'Masaj', 'rating': 4.6, 'experience': 12},
            {'id': 'provider-005', 'name': 'Yoga Instructor Zeynep', 'specialization': 'Yoga', 'rating': 4.8, 'experience': 7},
        ]
        
        recommendations = []
        for provider in sample_providers:
            score = self._calculate_provider_score(user_id, provider, favorite_providers)
            if score >= 0.6:
                recommendations.append({
                    **provider,
                    'recommendation_score': score,
                    'ai_insights': self._get_provider_insights(provider)
                })
        
        recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
        return recommendations[:limit]
    
    def _calculate_provider_score(self, user_id: str, provider: Dict[str, Any], 
                                 favorite_providers: List[str]) -> float:
        """Calculate recommendation score for a provider"""
        score = 0.4  # Base score
        
        # Boost for previously used providers
        if provider['id'] in favorite_providers:
            score += 0.4
        
        # Rating-based scoring
        score += (provider['rating'] - 4.0) * 0.2  # Scale rating impact
        
        # Experience-based scoring
        score += min(provider['experience'] / 15, 0.2)  # Max 0.2 for experience
        
        return min(score, 1.0)
    
    def _get_provider_insights(self, provider: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI insights about provider"""
        insights = {
            'expertise_level': 'Uzman' if provider['experience'] >= 8 else 'Deneyimli',
            'rating_category': 'Mükemmel' if provider['rating'] >= 4.8 else 'Çok İyi',
            'recommendation_strength': 'Güçlü Öneri' if provider['rating'] >= 4.7 else 'İyi Seçim',
        }
        
        # Generate dynamic insights
        if provider['experience'] >= 10:
            insights['experience_note'] = f"{provider['experience']} yıllık deneyim"
        
        if provider['rating'] >= 4.8:
            insights['rating_note'] = "Müşteri memnuniyeti çok yüksek"
        
        return insights
    
    def get_optimal_appointment_time(self, user_id: str, provider_id: str, date: str) -> List[Dict[str, Any]]:
        """Get AI-recommended optimal appointment times"""
        user_prefs = self.user_preferences.get(user_id, {})
        time_preferences = user_prefs.get('time_preferences', [])
        
        # Calculate user's preferred time slots
        if time_preferences:
            avg_preferred_hour = sum(time_preferences) / len(time_preferences)
        else:
            avg_preferred_hour = 14  # Default 2 PM
        
        # Generate time slots with AI scoring
        time_slots = []
        for hour in range(9, 18):  # 9 AM to 6 PM
            score = self._calculate_time_slot_score(hour, avg_preferred_hour)
            time_slots.append({
                'time': f"{hour:02d}:00",
                'score': score,
                'availability': 'available',  # Would check real availability
                'recommendation': self._get_time_recommendation(hour, avg_preferred_hour),
            })
        
        # Sort by score
        time_slots.sort(key=lambda x: x['score'], reverse=True)
        return time_slots[:5]  # Top 5 recommendations
    
    def _calculate_time_slot_score(self, hour: int, preferred_hour: float) -> float:
        """Calculate score for a time slot based on user preferences"""
        # Distance from preferred time
        time_diff = abs(hour - preferred_hour)
        score = max(0, 1 - (time_diff / 8))  # Normalize to 0-1
        
        # Boost for popular times
        if 10 <= hour <= 16:  # Popular business hours
            score += 0.1
        
        # Boost for lunch break times
        if hour in [12, 13]:
            score += 0.05
        
        return min(score, 1.0)
    
    def _get_time_recommendation(self, hour: int, preferred_hour: float) -> str:
        """Get recommendation reason for time slot"""
        if abs(hour - preferred_hour) <= 1:
            return "Tercih ettiğiniz saat dilimi"
        elif 12 <= hour <= 14:
            return "Öğle molası için ideal"
        elif 9 <= hour <= 11:
            return "Sabah sakinliği"
        elif 15 <= hour <= 17:
            return "Öğleden sonra uygun"
        else:
            return "Müsait zaman"
    
    def generate_customer_insights(self, user_id: str) -> Dict[str, Any]:
        """Generate comprehensive AI insights for customer"""
        user_prefs = self.user_preferences.get(user_id, {})
        behaviors = self.behavior_patterns.get(user_id, [])
        
        # Calculate various metrics
        total_appointments = len([b for b in behaviors if b['action'] == 'appointment_created'])
        favorite_services = user_prefs.get('favorite_services', [])
        favorite_providers = user_prefs.get('favorite_providers', [])
        
        # Service category analysis
        service_categories = defaultdict(int)
        for service_id in favorite_services:
            if 'beauty' in service_id:
                service_categories['Güzellik & Bakım'] += 1
            elif 'health' in service_id:
                service_categories['Sağlık & Wellness'] += 1
            elif 'fitness' in service_id:
                service_categories['Fitness & Spor'] += 1
        
        top_category = max(service_categories.items(), key=lambda x: x[1])[0] if service_categories else "Henüz belirlenemedi"
        
        # Generate insights
        insights = {
            'customer_profile': {
                'loyalty_level': self._calculate_loyalty_level(total_appointments),
                'activity_level': self._calculate_activity_level(behaviors),
                'preferred_category': top_category,
                'booking_pattern': self._analyze_booking_pattern(behaviors),
            },
            'statistics': {
                'total_appointments': total_appointments,
                'favorite_services_count': len(set(favorite_services)),
                'favorite_providers_count': len(set(favorite_providers)),
                'last_activity': self._get_last_activity_date(behaviors),
            },
            'recommendations': {
                'next_visit_suggestion': self._suggest_next_visit(user_id),
                'loyalty_rewards': self._calculate_loyalty_rewards(total_appointments),
                'personalized_offers': self._generate_personalized_offers(user_id),
            },
            'ai_score': {
                'satisfaction_prediction': random.uniform(0.8, 0.98),
                'retention_probability': random.uniform(0.85, 0.95),
                'recommendation_relevance': random.uniform(0.9, 1.0),
            }
        }
        
        return insights
    
    def _calculate_loyalty_level(self, appointment_count: int) -> str:
        """Calculate customer loyalty level"""
        if appointment_count >= 20:
            return "VIP Müşteri"
        elif appointment_count >= 10:
            return "Sadık Müşteri"
        elif appointment_count >= 5:
            return "Düzenli Müşteri"
        elif appointment_count >= 1:
            return "Yeni Müşteri"
        else:
            return "Potansiyel Müşteri"
    
    def _calculate_activity_level(self, behaviors: List[Dict]) -> str:
        """Calculate customer activity level"""
        recent_activities = [b for b in behaviors if 
                           datetime.fromisoformat(b['timestamp'].replace('Z', '+00:00')) > 
                           datetime.now(timezone.utc) - timedelta(days=30)]
        
        if len(recent_activities) >= 10:
            return "Çok Aktif"
        elif len(recent_activities) >= 5:
            return "Aktif"
        elif len(recent_activities) >= 2:
            return "Orta Düzey"
        else:
            return "Düşük Aktivite"
    
    def _analyze_booking_pattern(self, behaviors: List[Dict]) -> str:
        """Analyze booking patterns"""
        appointments = [b for b in behaviors if b['action'] == 'appointment_created']
        if len(appointments) < 2:
            return "Yeterli veri yok"
        
        # Analyze timing patterns
        appointment_times = []
        for apt in appointments:
            apt_time = apt['data'].get('appointment_time', '')
            if apt_time:
                hour = int(apt_time.split(':')[0])
                appointment_times.append(hour)
        
        if appointment_times:
            avg_hour = sum(appointment_times) / len(appointment_times)
            if avg_hour < 12:
                return "Sabah tercihi"
            elif avg_hour < 15:
                return "Öğle tercihi"
            else:
                return "Öğleden sonra tercihi"
        
        return "Esnek saat tercihi"
    
    def _get_last_activity_date(self, behaviors: List[Dict]) -> str:
        """Get last activity date"""
        if not behaviors:
            return "Henüz aktivite yok"
        
        last_activity = max(behaviors, key=lambda x: x['timestamp'])
        date = datetime.fromisoformat(last_activity['timestamp'].replace('Z', '+00:00'))
        return date.strftime('%d/%m/%Y')
    
    def _suggest_next_visit(self, user_id: str) -> Dict[str, Any]:
        """Suggest optimal next visit timing"""
        user_prefs = self.user_preferences.get(user_id, {})
        behaviors = self.behavior_patterns.get(user_id, [])
        
        # Calculate average time between visits
        appointments = [b for b in behaviors if b['action'] == 'appointment_created']
        if len(appointments) >= 2:
            dates = [datetime.fromisoformat(a['timestamp'].replace('Z', '+00:00')) for a in appointments]
            dates.sort()
            intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
            avg_interval = sum(intervals) / len(intervals)
        else:
            avg_interval = 30  # Default monthly
        
        next_visit_date = datetime.now() + timedelta(days=int(avg_interval))
        
        return {
            'suggested_date': next_visit_date.strftime('%Y-%m-%d'),
            'confidence': 0.85,
            'reason': f"Geçmiş verilerinize göre {int(avg_interval)} günde bir randevu alıyorsunuz",
        }
    
    def _calculate_loyalty_rewards(self, appointment_count: int) -> Dict[str, Any]:
        """Calculate loyalty rewards and benefits"""
        points = appointment_count * 10
        tier_benefits = {
            'VIP': ['%20 indirim', 'Öncelikli randevu', 'Özel teklifler', 'Ücretsiz danışmanlık'],
            'Sadık': ['%15 indirim', 'Erken randevu', 'Özel teklifler'],
            'Düzenli': ['%10 indirim', 'Bonus puanlar'],
            'Yeni': ['%5 indirim', 'Hoş geldin bonusu'],
        }
        
        loyalty_level = self._calculate_loyalty_level(appointment_count)
        benefits = tier_benefits.get(loyalty_level.split()[0], ['Hoş geldin bonusu'])
        
        return {
            'points': points,
            'tier': loyalty_level,
            'benefits': benefits,
            'next_tier_progress': min((appointment_count % 10) / 10 * 100, 100),
        }
    
    def _generate_personalized_offers(self, user_id: str) -> List[Dict[str, Any]]:
        """Generate personalized offers based on AI analysis"""
        user_prefs = self.user_preferences.get(user_id, {})
        favorite_services = user_prefs.get('favorite_services', [])
        
        offers = []
        
        # Service-based offers
        if any('beauty' in s for s in favorite_services):
            offers.append({
                'title': 'Güzellik Paketi',
                'description': 'Sevdiğiniz güzellik hizmetlerinde %25 indirim',
                'discount': 25,
                'valid_until': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            })
        
        # Time-based offers
        offers.append({
            'title': 'Erken Randevu Bonusu',
            'description': 'Sabah 9-11 arası randevularda ekstra %10 indirim',
            'discount': 10,
            'valid_until': (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d'),
        })
        
        # Loyalty offers
        offers.append({
            'title': 'Sadakat Bonusu',
            'description': 'Bir sonraki randevunuzda ücretsiz danışmanlık',
            'discount': 0,
            'valid_until': (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d'),
        })
        
        return offers[:2]  # Return top 2 offers
    
    def generate_chatbot_response(self, user_id: str, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate AI chatbot responses"""
        message_lower = message.lower()
        
        # Intent classification (simplified)
        if any(word in message_lower for word in ['randevu', 'appointment', 'book']):
            return self._handle_appointment_intent(user_id, message, context)
        elif any(word in message_lower for word in ['öneri', 'recommend', 'suggest']):
            return self._handle_recommendation_intent(user_id, message, context)
        elif any(word in message_lower for word in ['fiyat', 'price', 'cost']):
            return self._handle_price_intent(user_id, message, context)
        elif any(word in message_lower for word in ['iptal', 'cancel', 'değiştir']):
            return self._handle_modification_intent(user_id, message, context)
        else:
            return self._handle_general_intent(user_id, message, context)
    
    def _handle_appointment_intent(self, user_id: str, message: str, context: Dict) -> Dict[str, Any]:
        """Handle appointment-related queries"""
        responses = [
            "Randevu almak için size yardımcı olabilirim! Hangi hizmet için randevu istiyorsunuz?",
            "Tabii! Size en uygun randevu saatlerini önerebilirim. Tercih ettiğiniz tarih var mı?",
            "Randevu oluşturmak için birkaç bilgiye ihtiyacım var. Hangi hizmeti istiyorsunuz?",
        ]
        
        # Get personalized recommendations
        service_recs = self.get_service_recommendations(user_id, 3)
        quick_actions = ['Randevu Al', 'Müsait Saatleri Gör', 'Favorilerimi Göster']
        
        return {
            'message': random.choice(responses),
            'intent': 'appointment',
            'confidence': 0.9,
            'suggestions': [s['name'] for s in service_recs],
            'quick_actions': quick_actions,
            'follow_up': True,
        }
    
    def _handle_recommendation_intent(self, user_id: str, message: str, context: Dict) -> Dict[str, Any]:
        """Handle recommendation requests"""
        service_recs = self.get_service_recommendations(user_id, 3)
        provider_recs = self.get_provider_recommendations(user_id, 2)
        
        rec_text = "Size özel AI önerilerim:\n\n"
        rec_text += "🔍 Hizmetler:\n"
        for service in service_recs:
            rec_text += f"• {service['name']} - {service['reason']}\n"
        
        rec_text += f"\n👨‍⚕️ Uzmanlar:\n"
        for provider in provider_recs:
            rec_text += f"• {provider['name']} - {provider['ai_insights']['rating_category']}\n"
        
        return {
            'message': rec_text,
            'intent': 'recommendation',
            'confidence': 0.95,
            'recommendations': {
                'services': service_recs,
                'providers': provider_recs,
            },
            'quick_actions': ['Randevu Al', 'Daha Fazla Öneri', 'Favorilere Ekle'],
        }
    
    def _handle_price_intent(self, user_id: str, message: str, context: Dict) -> Dict[str, Any]:
        """Handle price-related queries"""
        responses = [
            "Fiyatlar hizmet türüne göre değişiyor. Hangi hizmet hakkında bilgi almak istiyorsunuz?",
            "Size özel indirimlerimiz var! Güncel fiyat listesini gösterebilirim.",
            "Fiyat bilgisi için hangi hizmeti merak ediyorsunuz? Size en uygun teklifleri sunabilirim.",
        ]
        
        # Get loyalty rewards
        user_prefs = self.user_preferences.get(user_id, {})
        behaviors = self.behavior_patterns.get(user_id, [])
        appointment_count = len([b for b in behaviors if b['action'] == 'appointment_created'])
        loyalty_info = self._calculate_loyalty_rewards(appointment_count)
        
        return {
            'message': random.choice(responses),
            'intent': 'price',
            'confidence': 0.85,
            'loyalty_discount': f"%{loyalty_info['points'] // 10}",
            'quick_actions': ['Fiyat Listesi', 'İndirimlerim', 'Paket Teklifleri'],
        }
    
    def _handle_modification_intent(self, user_id: str, message: str, context: Dict) -> Dict[str, Any]:
        """Handle appointment modification requests"""
        responses = [
            "Randevunuzu iptal etmek veya değiştirmek için yardımcı olabilirim. Hangi randevunuz hakkında?",
            "Tabii! Mevcut randevularınızı göstereyim ve değişiklik yapalım.",
            "Randevu değişikliği için size yardımcı olacağım. Hangi tarih/saat daha uygun?",
        ]
        
        return {
            'message': random.choice(responses),
            'intent': 'modification',
            'confidence': 0.8,
            'quick_actions': ['Randevularım', 'Tarih Değiştir', 'İptal Et'],
        }
    
    def _handle_general_intent(self, user_id: str, message: str, context: Dict) -> Dict[str, Any]:
        """Handle general queries"""
        responses = [
            "Size nasıl yardımcı olabilirim? Randevu, öneri veya genel bilgi için buradayım!",
            "Merhaba! Size özel AI asistanınızım. Randevu almak veya öneri almak için sorabilirsiniz.",
            "Hoş geldiniz! Size en iyi hizmeti sunmak için buradayım. Ne arıyorsunuz?",
        ]
        
        quick_actions = [
            'Randevu Al', 'Öneri İste', 'Randevularım', 
            'Fiyat Bilgisi', 'Popüler Hizmetler'
        ]
        
        return {
            'message': random.choice(responses),
            'intent': 'general',
            'confidence': 0.7,
            'quick_actions': quick_actions,
        }
    
    def generate_comprehensive_report(self, user_id: str, period_months: int = 1) -> dict:
        """
        Generate comprehensive AI report for user
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=period_months * 30)
        
        # Mock data - gerçek uygulamada database'den alınır
        appointments_data = [
            {'service': 'Saç Kesimi', 'date': '2024-06-15', 'price': 150, 'rating': 5},
            {'service': 'Sakal Düzeltme', 'date': '2024-06-10', 'price': 50, 'rating': 4},
            {'service': 'Cilt Bakımı', 'date': '2024-06-05', 'price': 200, 'rating': 5},
            {'service': 'Masaj', 'date': '2024-05-30', 'price': 300, 'rating': 4},
            {'service': 'Saç Boyama', 'date': '2024-05-25', 'price': 250, 'rating': 5},
        ]
        
        # Process data
        total_spent = sum([apt['price'] for apt in appointments_data])
        avg_rating = sum([apt['rating'] for apt in appointments_data]) / len(appointments_data)
        
        # Generate monthly trends
        monthly_data = []
        for i in range(period_months):
            month_start = end_date - timedelta(days=(i+1)*30)
            monthly_data.append({
                'month': month_start.strftime('%Y-%m'),
                'appointments': random.randint(2, 8),
                'spending': random.randint(200, 800),
                'satisfaction': random.uniform(4.0, 5.0),
            })
        
        # Top services analysis
        service_counts = defaultdict(int)
        service_spending = defaultdict(float)
        service_ratings = defaultdict(list)
        
        for apt in appointments_data:
            service_counts[apt['service']] += 1
            service_spending[apt['service']] += apt['price']
            service_ratings[apt['service']].append(apt['rating'])
        
        top_services = {}
        for service in service_counts:
            top_services[service] = {
                'count': service_counts[service],
                'spending': service_spending[service],
                'avg_rating': sum(service_ratings[service]) / len(service_ratings[service]),
                'percentage': (service_counts[service] / len(appointments_data)) * 100
            }
        
        # AI predictions
        insights = self.generate_customer_insights(user_id)
        ai_predictions = insights['ai_score']
        
        return {
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'period_months': period_months
            },
            'summary': {
                'total_appointments': len(appointments_data),
                'total_spent': total_spent,
                'average_spent_per_visit': total_spent / len(appointments_data),
                'average_rating': avg_rating,
                'unique_services': len(service_counts)
            },
            'monthly_trends': monthly_data,
            'top_services': top_services,
            'preferred_providers': [
                {'name': 'Ahmet Yılmaz', 'visits': 3, 'rating': 4.8, 'speciality': 'Saç Tasarım'},
                {'name': 'Fatma Demir', 'visits': 2, 'rating': 4.9, 'speciality': 'Cilt Bakım'}
            ],
            'ai_predictions': {
                'satisfaction_score': ai_predictions['satisfaction_prediction'],
                'loyalty_score': ai_predictions['retention_probability'],
                'recommendation_relevance': ai_predictions['recommendation_relevance'],
                'next_visit_probability': random.uniform(0.7, 0.9),
                'preferred_time_slots': ['10:00-12:00', '14:00-16:00'],
                'seasonal_trends': {
                    'high_activity_months': ['Aralık', 'Haziran', 'Eylül'],
                    'preferred_services_by_season': {
                        'Yaz': ['Cilt Bakımı', 'Saç Kesimi'],
                        'Kış': ['Masaj', 'Saç Boyama']
                    }
                }
            },
            'recommendations': {
                'next_services': insights['recommendations']['next_visit_suggestion'],
                'optimal_booking_times': ['Hafta içi 10:00-12:00', 'Hafta sonu 14:00-16:00'],
                'budget_optimization': f'Aylık {int(total_spent/period_months)}₺ bütçenizi %15 daha verimli kullanabilirsiniz',
                'loyalty_benefits': 'Premium üyelik ile %20 indirim kazanabilirsiniz'
            }
        } 