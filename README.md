# 🕒 ZamanYönet - Randevu Yönetim Sistemi

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production-green.svg)
![Platform](https://img.shields.io/badge/platform-web%20%7C%20mobile-lightgrey.svg)

## 🚀 **Live Demo**
- **🌐 Website**: [https://zaman-yonet-website.onrender.com](https://zaman-yonet-website.onrender.com)
- **⚡ API**: [https://zaman-yonet-api.onrender.com](https://zaman-yonet-api.onrender.com)
- **📱 Flutter App**: Android APK mevcut

## 📖 **Proje Açıklaması**

ZamanYönet, modern bir randevu yönetim sistemidir. Web, mobile ve API bileşenlerinden oluşan full-stack çözüm sunar.

### ✨ **Özellikler**
- 🔐 **Güvenli Authentication** (JWT, bcrypt)
- 👥 **Rol Tabanlı Erişim** (Admin, Provider, Customer, Guest)
- 📅 **Gerçek Zamanlı Randevu Yönetimi**
- 🌐 **CORS Enabled API**
- 📱 **Flutter Mobile App**
- 🎨 **Modern Responsive Website**
- 🤖 **AI-Powered Recommendations**

## 🏗️ **Proje Yapısı**

```
randevu_projesi/
├── 🎯 PRODUCTION
│   ├── app_extreme_minimal.py     # 🚀 Production API (deployed)
│   ├── requirements.txt           # 📦 Flask + Gunicorn only
│   └── website/index.html         # 🌐 Static website
│
├── 🔧 DEVELOPMENT  
│   ├── app.py                     # 💻 Full development API
│   ├── config.py                  # ⚙️ Configuration
│   ├── models/                    # 🗄️ Database models
│   ├── routes/                    # 🛣️ API routes
│   └── utils/                     # 🔧 Security, logging, validation
│
├── 📱 MOBILE
│   └── appointment_app/           # 📱 Flutter app (complete)
│
└── 📚 DOCS
    ├── API_TEST_SONUCLARI.md     # 🧪 API test results
    └── deploy_guide.md           # 🚀 Deployment guide
```

## 🚀 **Quick Start**

### **Development Setup**
```bash
# Clone repository
git clone [repo-url]
cd randevu_projesi

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```

### **Production Deployment**
```bash
# Already deployed to:
# API: https://zaman-yonet-api.onrender.com
# Website: https://zaman-yonet-website.onrender.com
```

## 🔗 **API Endpoints**

### **Authentication**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh

### **Appointments** 
- `GET /appointments` - List appointments
- `POST /appointments` - Create appointment
- `PUT /appointments/<id>` - Update appointment
- `DELETE /appointments/<id>` - Delete appointment

### **Services**
- `GET /services` - List services
- `POST /services` - Create service
- `GET /services/<id>` - Service details

### **Providers**
- `GET /providers` - List providers
- `GET /providers/<id>` - Provider details
- `GET /providers/<id>/working-hours` - Working hours

### **System**
- `GET /health` - Health check
- `GET /` - API documentation

## 📱 **Mobile App (Flutter)**

Full-featured Flutter app with:
- 🔐 Authentication
- 📅 Appointment booking
- 👤 Profile management
- 🌐 Multi-language support (TR/EN)
- 📊 Analytics dashboard

### **Build Mobile App:**
```bash
cd appointment_app
flutter pub get
flutter build apk
```

## 🌐 **Website Features**

Modern, responsive website includes:
- 🎨 **Beautiful UI** with gradient design
- 📱 **Mobile-friendly** responsive layout
- 🔄 **Live Demo** with real API integration
- 🔐 **Authentication** modals
- 📊 **Statistics** display
- ⚡ **Performance** optimized

## 🔧 **Technology Stack**

### **Backend (API)**
- **Flask 2.3.3** - Lightweight web framework
- **Gunicorn 21.2.0** - WSGI server
- **JWT** - Token-based authentication
- **CORS** - Cross-origin resource sharing

### **Frontend (Website)**
- **HTML5/CSS3** - Modern web standards
- **JavaScript ES6+** - Interactive functionality
- **Font Awesome** - Icon library
- **Responsive Design** - Mobile-first approach

### **Mobile (Flutter)**
- **Flutter 3.x** - Cross-platform framework
- **Dart** - Programming language
- **SQLite** - Local database
- **HTTP** - API communication

### **Deployment**
- **Render.com** - Cloud hosting
- **Git** - Version control
- **GitHub** - Repository hosting

## 📊 **API Test Results**

✅ **All endpoints tested and working**
- Response times: 200-234ms
- Success rate: 100%
- CORS: Fully enabled
- Authentication: JWT working

See: `API_TEST_SONUCLARI.md` for detailed results.

## 🌟 **Deployment Status**

| Component | Status | URL |
|-----------|--------|-----|
| 🌐 **Website** | ✅ Live | [zaman-yonet-website.onrender.com](https://zaman-yonet-website.onrender.com) |
| ⚡ **API** | ✅ Live | [zaman-yonet-api.onrender.com](https://zaman-yonet-api.onrender.com) |
| 📱 **Mobile App** | ✅ Built | APK available |
| 🧪 **Tests** | ✅ Passed | All endpoints working |

## 🔐 **Security Features**

- 🔒 **JWT Authentication** with refresh tokens
- 🛡️ **Rate Limiting** on all endpoints
- 🔐 **CORS Protection** properly configured
- 🚫 **Input Validation** on all forms
- 📝 **Comprehensive Logging** for security events

## 📈 **Performance**

- ⚡ **Fast API** responses (200-234ms)
- 🚀 **Lightweight** deployment (2 packages only)
- 📱 **Mobile Optimized** Flutter app
- 🌐 **CDN Ready** static website
- 💾 **In-memory** storage for demo

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License.

## 👨‍💻 **Developer**

Created with ❤️ by [Your Name]

---

**🎯 Production Ready | 🚀 Fully Deployed | �� Multi-Platform** 