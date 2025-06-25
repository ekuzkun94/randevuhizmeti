# 🏗️ ZamanYönet - AI Destekli Proje Yapısı

## 📱 Proje Tanımı
**ZamanYönet**, yapay zekâ destekli zaman ve görev yönetimi platformudur. AI öneri motoru ile kullanıcı davranışlarını analiz eder ve optimize önerileri sunar.

## ⚙️ Teknoloji Yığını
- **Frontend:** Flutter (Web + Mobile)
- **Backend:** Flask → FastAPI (Migration)
- **Veritabanı:** Supabase (PostgreSQL)
- **Authentication:** JWT + Supabase Auth
- **AI:** Öneri motoru ve davranış analizleri
- **Bildirim:** Firebase + Local Notifications

## 👤 Kullanıcı Rolleri
- **Admin:** Sistem yönetimi ve kullanıcı kontrolü
- **Provider:** İşletme yetkilisi, randevu yönetimi
- **Customer:** Son kullanıcı, plan ve sağlık yönetimi
- **Guest:** Hızlı erişim kullanıcısı

## 📁 Backend Modül Yapısı

### Core Modules (Mevcut)
```
├── routes/
│   ├── auth_routes.py ✅
│   ├── appointments.py ✅  
│   ├── services.py ✅
│   ├── providers.py ✅
│   └── admin_logs.py ✅
├── models/
│   └── models.py ✅
├── utils/
│   ├── security.py ✅
│   ├── logger.py ✅
│   └── validators.py ✅
```

### New Modules (AI Analiz Önerisi)
```
├── routes/
│   ├── medications.py ❌ (eklenecek)
│   ├── activities.py ❌ (eklenecek)
│   ├── tasks.py ❌ (eklenecek)
│   └── businesses.py ❌ (SaaS multi-tenant)
├── ai/
│   ├── recommendation_engine.py ❌ (eklenecek)
│   ├── behavior_analysis.py ❌ (eklenecek)
│   └── pattern_detector.py ❌ (eklenecek)
├── services/
│   ├── ai_service.py ❌ (eklenecek)
│   ├── notification_service.py ❌ (eklenecek)
│   └── analytics_service.py ❌ (eklenecek)
```

## 📊 Database Schema (Extended)

### Existing Tables
- users ✅
- roles ✅
- providers ✅
- services ✅
- appointments ✅

### New Tables (AI Analiz)
- medications ❌
- activities ❌
- tasks ❌
- businesses ❌ (SaaS)
- user_behaviors ❌ (AI Data)
- recommendations ❌ (AI Output)

## 🤖 AI Features Roadmap

### Phase 1: Basic AI (Current)
- [x] AI Helper endpoint
- [x] Basic recommendations
- [x] Static suggestions

### Phase 2: Smart Recommendations (Target)
- [ ] User behavior tracking
- [ ] Pattern recognition
- [ ] Time-based suggestions
- [ ] Health optimization

### Phase 3: Advanced AI (Future)
- [ ] Machine learning models
- [ ] Predictive analytics
- [ ] Multi-tenant AI
- [ ] Real-time optimization

## 🎯 Implementation Priority

1. **Database Extension** (medications, activities, tasks)
2. **AI Recommendation Engine**
3. **SaaS Multi-tenant Structure**
4. **Flutter Module Extensions**
5. **FastAPI Migration Planning**

## 🔄 Migration Strategy

### Flask → FastAPI
1. Keep current Flask for stability
2. Create parallel FastAPI structure
3. Gradual endpoint migration
4. Testing & validation
5. Full switch over

### Frontend Updates
1. New Flutter screens for medications/activities/tasks
2. AI recommendation widgets
3. Multi-business support
4. Enhanced UX/UI

## 🚀 Next Steps

1. ✅ Analyze current structure
2. 🔄 Add new database models
3. 🔄 Implement AI recommendation engine
4. 🔄 Create new API endpoints
5. 🔄 Update Flutter screens
6. 🔄 SaaS multi-tenant setup 