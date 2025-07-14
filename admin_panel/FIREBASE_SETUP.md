# Firebase Kurulum Rehberi

Bu proje artık Firebase kullanıyor. Aşağıdaki adımları takip ederek Firebase'i yapılandırın:

## 1. Firebase Console'da Proje Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Proje Ekle" butonuna tıklayın
3. Proje adını girin (örn: "admin-panel")
4. Google Analytics'i etkinleştirmeyi seçebilirsiniz (opsiyonel)
5. "Proje Oluştur" butonuna tıklayın

## 2. Web Uygulaması Ekleme

1. Firebase Console'da projenizi açın
2. "Web" simgesine tıklayın (</>)
3. Uygulama takma adı girin (örn: "admin-panel-web")
4. "Uygulama Kaydet" butonuna tıklayın
5. Firebase yapılandırma bilgilerini kopyalayın

## 3. Authentication Kurulumu

1. Sol menüden "Authentication" seçin
2. "Başlayın" butonuna tıklayın
3. "Sign-in method" sekmesine gidin
4. "Email/Password" sağlayıcısını etkinleştirin
5. "Kaydet" butonuna tıklayın

## 4. Firestore Database Kurulumu

1. Sol menüden "Firestore Database" seçin
2. "Veritabanı oluştur" butonuna tıklayın
3. "Test modunda başlat" seçeneğini seçin (geliştirme için)
4. Veritabanı konumunu seçin (örn: europe-west3)
5. "Bitti" butonuna tıklayın

## 5. Environment Variables

Proje kök dizininde `.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Bu değerleri Firebase Console'da proje ayarlarından alabilirsiniz.

## 6. Güvenlik Kuralları (Firestore)

Firestore Database > Rules sekmesinde aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar sadece kendi verilerini okuyabilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin kullanıcılar tüm verileri okuyabilir
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 7. Test Kullanıcısı Oluşturma

1. Authentication > Users sekmesine gidin
2. "Kullanıcı ekle" butonuna tıklayın
3. Email ve şifre girin (örn: admin@demo.com / demo123)
4. "Kullanıcı ekle" butonuna tıklayın

## 8. Uygulamayı Çalıştırma

```bash
npm run dev
```

Artık Firebase ile çalışan admin paneliniz hazır!

## Önemli Notlar

- Firebase'in ücretsiz planı (Spark) çoğu geliştirme projesi için yeterlidir
- Production'a geçmeden önce güvenlik kurallarını gözden geçirin
- Environment variables'ları asla GitHub'a commit etmeyin
- Firebase Console'da kullanım istatistiklerini takip edin 