# 📍 Render.com Start Command Nerede? - Detaylı Rehber

## 🚀 Step-by-Step Render Setup

### 1. Render.com Dashboard'a Giriş
1. https://render.com adresine git
2. "Sign In" ile giriş yap (veya "Get Started" ile hesap oluştur)

### 2. New Web Service Oluştur
1. Dashboard'da **"New"** butonuna tıkla (sağ üstte + işareti)
2. **"Web Service"** seçeneğini seç
3. **"Build and deploy from a Git repository"** seçeneğini seç

### 3. Repository Bağla
1. **"Connect GitHub"** butonuna tıkla
2. Repository'nizi seçin: `randevu_projesi`
3. **"Connect"** butonuna tıkla

### 4. Service Configuration (Burası Önemli!)
Bu ekranda şu alanları göreceksiniz:

```
📋 SERVICE CONFIGURATION EKRANI:

┌─────────────────────────────────────┐
│ Name: [zamanyonet-api]              │ ← Service adı
├─────────────────────────────────────┤
│ Region: [Frankfurt (EU Central)]    │ ← En yakın bölge
├─────────────────────────────────────┤
│ Branch: [main]                      │ ← Git branch
├─────────────────────────────────────┤
│ Runtime: [Python 3]                │ ← Otomatik detect
├─────────────────────────────────────┤
│ Build Command:                      │ ← 1. BURAYA GİR
│ [                                 ] │
├─────────────────────────────────────┤
│ Start Command:                      │ ← 2. BURAYA GİR  
│ [                                 ] │
└─────────────────────────────────────┘
```

### 5. Commands'ı Gir

**Build Command alanına:**
```bash
pip install --no-cache-dir -r requirements_render_ultra_minimal.txt
```

**Start Command alanına:**
```bash
gunicorn -w 2 -b 0.0.0.0:$PORT app_ultra_minimal:app --timeout 60
```

### 6. Advanced Settings (Optional)
Aşağıda **"Advanced"** sekmesi var, oradan:
- **Plan:** Free (0$/month)
- **Auto-Deploy:** Yes (otomatik deploy için)

### 7. Environment Variables
**"Environment Variables"** bölümünde **"Add Environment Variable"** ile ekle:

```bash
# Required
DATABASE_URL = postgresql://postgres.ugmyyphiqoahludwuzpu:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
SECRET_KEY = your-random-32-char-secret
JWT_SECRET_KEY = your-different-32-char-secret
SUPABASE_PASSWORD = your_supabase_password

# Optional  
FLASK_ENV = production
DEBUG = false
```

### 8. Deploy!
**"Create Web Service"** butonuna tıkla

## 🔍 Start Command Bulamıyorsanız

### Senaryo 1: İlk Setup'ta Görünmüyor
- Eğer ilk setup ekranında görünmüyorsa
- Service oluşturduktan sonra **"Settings"** sekmesine git
- **"Build & Deploy"** bölümünde bulacaksınız

### Senaryo 2: Service Zaten Oluşturulmuş
1. Dashboard'da service'inizi seç
2. **"Settings"** sekmesine tıkla
3. **"Build & Deploy"** bölümünde:
   - **Build Command** alanı
   - **Start Command** alanı

### Senaryo 3: Mobil/Küçük Ekran
- Eğer ekran küçükse, aşağı scroll yapın
- Commands alanları daha aşağıda olabilir

## 📱 Visual Guide

```
RENDER DASHBOARD LAYOUT:

┌──────────────────────────────────────────┐
│ 🏠 Dashboard | Services | Account        │ ← Top menu
├──────────────────────────────────────────┤
│                                          │
│ New [+] ← Buraya tıkla                  │
│                                          │
│ ┌─ Web Service                          │
│ ├─ Static Site                          │
│ ├─ Private Service                      │
│ └─ Background Worker                    │
│                                          │
└──────────────────────────────────────────┘

SERVICE SETTINGS:
┌──────────────────────────────────────────┐
│ Overview | Events | Logs | Settings      │
├──────────────────────────────────────────┤
│                                          │
│ Build & Deploy ← Bu bölümde              │
│ ├─ Build Command                         │
│ ├─ Start Command ← BURASI                │
│ ├─ Environment Variables                 │
│ └─ Deploy Hook                           │
│                                          │
└──────────────────────────────────────────┘
```

## ⚡ Quick Copy-Paste

### Build Command:
```
pip install --no-cache-dir -r requirements_render_ultra_minimal.txt
```

### Start Command:
```
gunicorn -w 2 -b 0.0.0.0:$PORT app_ultra_minimal:app --timeout 60
```

## 🆘 Hala Bulamıyorsanız

1. **Refresh** yapın (Ctrl+F5)
2. **Başka browser** deneyin
3. **Incognito mode** kullanın
4. Render support'a yazın

## 🎯 Alternative: render.yaml kullan

Eğer manual setup zor geliyorsa, repository'nizde `render_ultra_minimal.yaml` dosyası var.
Bu dosyayı `render.yaml` olarak rename edin, Render otomatik olarak okuyacak.

```bash
# Dosya adını değiştir
mv render_ultra_minimal.yaml render.yaml
git add render.yaml
git commit -m "Add Render config"
git push
```

Bu durumda Render bu settings'leri otomatik alacak! 