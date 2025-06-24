# 🚀 ZamanYönet Production Deployment Rehberi

## 1. 📋 Ön Hazırlık

### Supabase Setup
1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni proje oluşturun
3. Database password'ü kaydedin
4. Project Settings > API'dan şu bilgileri alın:
   - `Project URL`
   - `anon public key`
   - `service_role key`
5. Settings > Database'den connection string alın

### Environment Variables
`.env.production` dosyası oluşturun:

```bash
# Flask
FLASK_ENV=production
SECRET_KEY=your-super-secret-production-key
JWT_SECRET_KEY=your-jwt-secret-key

# Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@yourdomain.com

# Security
LOG_LEVEL=WARNING
```

## 2. 🔄 Migration İşlemi

### Adım 1: Dependencies
```bash
pip install -r requirements_production.txt
```

### Adım 2: Migration Çalıştır
```bash
python migration_to_supabase.py
```

### Adım 3: Verify
Supabase Dashboard'da tabloların oluştuğunu kontrol edin.

## 3. 🌐 Deployment Seçenekleri

### A. Railway (Önerilen - Kolay)

1. [Railway](https://railway.app) hesabı oluşturun
2. GitHub repo'nuzu bağlayın
3. Environment variables ekleyin
4. `railway.json` oluşturun:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

5. `Procfile` oluşturun:
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

### B. Heroku

1. Heroku CLI kurun
2. Proje klasöründe:

```bash
heroku create zamanyonet-api
heroku config:set FLASK_ENV=production
heroku config:set DATABASE_URL=your-supabase-url
# Diğer env vars...
git push heroku main
```

### C. Vercel (Serverless)

1. `vercel.json` oluşturun:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ],
  "env": {
    "FLASK_ENV": "production"
  }
}
```

2. Deploy:
```bash
vercel --prod
```

### D. VPS/Server (Manuel)

```bash
# Server'da
git clone your-repo
cd zamanyonet
pip install -r requirements_production.txt

# Environment setup
cp .env.production .env

# Gunicorn ile başlat
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# Nginx proxy (opsiyonel)
# SSL sertifikası (Let's Encrypt)
```

## 4. 🔧 Production Optimizasyonları

### Gunicorn Config (`gunicorn.conf.py`)
```python
bind = "0.0.0.0:8000"
workers = 4
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 5
preload_app = True
```

### Nginx Config (VPS için)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Redis (Opsiyonel Cache)
```bash
# Railway/Heroku'da Redis eklentisi
# Environment'a ekle:
REDIS_URL=redis://your-redis-url
```

## 5. 📱 Frontend Integration

### Flutter App Config
`lib/config/api_config.dart`:
```dart
class ApiConfig {
  static const String baseUrl = 'https://your-api-domain.com';
  static const String apiVersion = '/api/v1';
  
  static const Duration timeout = Duration(seconds: 30);
  
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}
```

### API Endpoints
```
Production API: https://your-domain.com
Admin Dashboard: https://your-domain.com/admin/dashboard
Health Check: https://your-domain.com/health
```

## 6. 🔍 Monitoring & Maintenance

### Logs
```bash
# Railway/Heroku logs
railway logs
heroku logs --tail

# Server logs
tail -f logs/production.log
```

### Health Checks
- `/health` endpoint monitoring
- Supabase dashboard monitoring
- Performance metrics

### Backup Strategy
- Supabase otomatik backup yapar
- Manual backup: SQL Export

## 7. 🛡️ Security Checklist

- [x] HTTPS zorunlu
- [x] Environment variables güvenli
- [x] Database credentials güvenli
- [x] CORS production domains
- [x] Rate limiting aktif
- [x] Security headers
- [x] Input validation
- [x] SQL injection protection

## 8. 🔄 CI/CD (Opsiyonel)

### GitHub Actions (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: pip install -r requirements_production.txt
    
    - name: Run tests
      run: python -m pytest
    
    - name: Deploy to Railway
      run: railway deploy
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 9. 📊 Performance

### Expected Performance
- Response time: <200ms
- Concurrent users: 100+
- Database queries: Optimized with indexes
- Caching: Redis for sessions

### Scaling
- Railway: Auto-scaling
- Heroku: Dyno scaling
- VPS: Load balancer + multiple instances

## 🎯 Deployment Checklist

- [ ] Supabase projesi oluşturuldu
- [ ] Environment variables set edildi
- [ ] Migration çalıştırıldı
- [ ] Production config test edildi
- [ ] HTTPS sertifikası aktif
- [ ] Domain DNS ayarları yapıldı
- [ ] Monitoring setup'ı yapıldı
- [ ] Backup stratejisi planlandı
- [ ] Flutter app production API'ye yönlendirildi

**🎉 Başarılı deployment sonrası ZamanYönet production'da!** 