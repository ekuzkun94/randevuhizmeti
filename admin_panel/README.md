# Randevu Admin Paneli

Modern ve responsive web tabanlı admin paneli. Next.js, Supabase ve Tailwind CSS kullanılarak geliştirilmiştir.

## 🚀 Özellikler

- **Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- **Modern UI/UX**: Tailwind CSS ile güzel ve kullanıcı dostu arayüz
- **Supabase Entegrasyonu**: Güvenli authentication ve database
- **Dashboard**: İstatistikler ve genel bakış
- **Kullanıcı Yönetimi**: Kullanıcı listesi ve yönetimi
- **Randevu Yönetimi**: Randevu oluşturma, düzenleme ve takip
- **Ayarlar**: Profil ve sistem ayarları

## 📱 Responsive Özellikler

- **Mobil**: Tamamen mobil uyumlu tasarım
- **Tablet**: Orta boyutlu ekranlar için optimize edilmiş
- **Desktop**: Büyük ekranlar için genişletilmiş layout
- **Sidebar**: Mobilde gizlenebilir, desktop'ta sabit
- **Grid Sistemi**: Responsive grid layout'ları

## 🛠️ Teknolojiler

- **Next.js 14**: React framework
- **TypeScript**: Tip güvenliği
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase**: Backend as a Service
- **Lucide React**: Modern icon set

## 🚀 Kurulum

1. **Projeyi klonlayın:**
```bash
git clone <repository-url>
cd admin_panel
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Environment değişkenlerini ayarlayın:**
`.env.local` dosyası oluşturun:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

5. **Tarayıcıda açın:**
```
http://localhost:3000
```

## 📁 Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard sayfaları
│   ├── login/            # Login sayfası
│   └── page.tsx          # Ana sayfa
├── components/           # React komponentleri
│   └── DashboardLayout.tsx
├── lib/                  # Utility fonksiyonları
│   └── supabase.ts
└── types/               # TypeScript tipleri
    └── auth.ts
```

## 🔐 Authentication

- Supabase Auth kullanılıyor
- Email/şifre ile giriş
- Oturum yönetimi
- Güvenli route koruması

## 📊 Sayfalar

1. **Login** (`/login`): Kullanıcı girişi
2. **Dashboard** (`/dashboard`): Ana dashboard
3. **Kullanıcılar** (`/dashboard/users`): Kullanıcı yönetimi
4. **Randevular** (`/dashboard/appointments`): Randevu yönetimi
5. **Ayarlar** (`/dashboard/settings`): Sistem ayarları

## 🎨 Tasarım Özellikleri

- **Modern Card Layout**: Temiz ve organize görünüm
- **Responsive Grid**: Esnek grid sistemi
- **Interactive Elements**: Hover efektleri ve animasyonlar
- **Color Scheme**: Tutarlı renk paleti
- **Typography**: Okunabilir tipografi

## 📱 Mobil Uyumluluk

- **Touch Friendly**: Dokunmatik cihazlar için optimize
- **Responsive Navigation**: Mobilde hamburger menü
- **Flexible Layouts**: Tüm ekran boyutlarında uyumlu
- **Optimized Tables**: Mobilde scroll edilebilir tablolar

## 🔧 Geliştirme

```bash
# Geliştirme modu
npm run dev

# Production build
npm run build

# Production sunucusu
npm start

# Linting
npm run lint
```

## 📦 Deployment

### Vercel (Önerilen)
1. Vercel hesabı oluşturun
2. GitHub repository'nizi bağlayın
3. Environment değişkenlerini ayarlayın
4. Deploy edin

### Netlify
1. Netlify hesabı oluşturun
2. Repository'nizi bağlayın
3. Build komutunu ayarlayın: `npm run build`
4. Publish directory: `out`

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🆘 Destek

Herhangi bir sorun yaşarsanız:
1. GitHub Issues'da sorun bildirin
2. Email ile iletişime geçin
3. Dokümantasyonu kontrol edin

---

**Not**: Bu proje demo amaçlıdır. Gerçek kullanım için Supabase konfigürasyonu ve güvenlik ayarları yapılmalıdır.
