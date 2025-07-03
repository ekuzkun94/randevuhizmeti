# Randevu Admin Panel

Randevu sistemi için Flutter ile geliştirilmiş mobil admin paneli.

## Özellikler

- ✅ Supabase entegrasyonu
- ✅ Email/Şifre ile giriş
- ✅ Modern ve responsive UI
- ✅ State management (Provider)
- ✅ Güvenli routing (Go Router)
- ✅ Dashboard ekranı

## Kurulum

1. Flutter SDK'nın kurulu olduğundan emin olun
2. Proje bağımlılıklarını yükleyin:
   ```bash
   flutter pub get
   ```

3. Supabase konfigürasyonunu yapın:
   - `lib/main.dart` dosyasında `YOUR_SUPABASE_URL` ve `YOUR_SUPABASE_ANON_KEY` değerlerini kendi Supabase proje bilgilerinizle değiştirin

4. Uygulamayı çalıştırın:
   ```bash
   flutter run
   ```

## Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni proje oluşturun
3. Proje URL'si ve Anon Key'i alın
4. Bu bilgileri `lib/main.dart` dosyasına ekleyin

## Kullanım

1. Uygulama açıldığında login ekranı görünecek
2. Supabase'de kayıtlı email/şifre ile giriş yapın
3. Dashboard ekranında admin paneli özelliklerine erişin

## Geliştirme

Proje şu anda temel login ve dashboard ekranlarını içermektedir. Diğer özellikler (randevular, müşteriler, hizmetler) sonraki adımlarda eklenecektir.

## Teknolojiler

- Flutter 3.32.4
- Supabase
- Provider (State Management)
- Go Router (Navigation)
- Material Design 3
