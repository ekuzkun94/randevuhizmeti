## 📘 Proje Tanımı: ZamanYönet

**ZamanYönet**, bireyler ve işletmeler için tasarlanmış yapay zekâ destekli bir zaman ve görev yönetimi platformudur. AI destekli öneri motoru sayesinde kullanıcıların zaman yönetimini optimize eder.

---

## ⚙️ Teknoloji Yığını

- **Frontend:** Flutter
- **Backend:** Python (FastAPI)
- **Veritabanı:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (JWT)
- **AI:** Öneri motoru ve kullanıcı davranış analizleri
- **Bildirim:** Firebase Messaging + Local Notifications (Flutter)

---

## 👤 Kullanıcı Rolleri

| Rol      | Açıklama                                           |
| -------- | -------------------------------------------------- |
| Admin    | Sistem yönetimi ve kullanıcı kontrolü              |
| Provider | İşletme yetkilisi, randevu ve görev yönetimi yapar |
| Customer | Son kullanıcı, plan ve sağlık yönetimi sağlar      |
| Guest    | Hızlı erişim amaçlı kullanıcı tipi                 |

---

## 🔐 Güvenlik ve Yetkilendirme

- Supabase Auth ile oturum yönetimi (JWT)
- Yetki kontrolü Flutter tarafında route bazlı
- Supabase Row-Level Security (RLS)

---

## 🔧 Supabase Kurulumu (Adım Adım Öğretici)

### 📌 Hesap Oluştur ve Proje Başlat

1. [https://supabase.com](https://supabase.com) → Ücretsiz hesap oluştur
2. Yeni proje oluştur: `zaman_yonet_db`
3. Parola ve veritabanı adı belirle
4. Proje açıldığında → **Project URL** ve **anon key** değerlerini not al

### 🗃️ Tabloları Oluştur (Supabase GUI)

Her modül için yeni tablo oluştur:

- appointments
- medications
- activities
- tasks
- users
- businesses *(SaaS çoklu işletme desteği için)*

📌 GUI'de "Table Editor" → "+ New Table" → sütunları yukarıdaki şemalara göre doldur

### 🔐 RLS (Row-Level Security)

- Her tablo için: `Enable RLS` seç
- “Policies” sekmesinden: `user_id = auth.uid()` koşullu kural ekle (GUI yönlendirmeli)

### 🧮 Supabase Fonksiyonları ile Gerçek Zamanlı İstatistik

Supabase Function (SQL veya Edge Function):

```sql
create or replace function get_weekly_activity(user_id uuid)
returns table(day text, total int)
as $$
  select to_char(date, 'Day') as day, count(*) as total
  from activities
  where user_id = get_weekly_activity.user_id and date > now() - interval '7 days'
  group by day;
$$ language sql;
```

Flutter tarafında çağır:

```dart
final res = await supabase.rpc("get_weekly_activity", params: {"user_id": user.id});
```

---

## 🤖 AI Modeli ve Eğitim Verisi

### 🔍 Öğrenme Verileri

- Randevu iptalleri
- İlaç saatleri ve gecikmeleri
- Spor tekrar sıklığı
- Görev tamamlanma oranı

### 🧠 AI Modeli (Python – FastAPI)

```python
class AiModel:
    def __init__(self, db):
        self.db = db

    def train_on_usage(self, user_id):
        data = self.db.get_user_behavior(user_id)
        # Kullanıcının en verimli zaman aralıklarını öğren
        pattern = analyze_patterns(data)
        return pattern

    def suggest(self, user_id):
        pattern = self.train_on_usage(user_id)
        return generate_suggestions(pattern)
```

### 🧬 Eğitim Verisi Örneği

```json
{
  "user_id": "uuid",
  "data": {
    "appointments": ["2025-06-24T10:00", "2025-06-25T14:00"],
    "tasks": ["Tamamlandı", "Ertelendi"],
    "medications": ["08:00", "08:15"],
    "activity": ["Koşu", "Yoga"]
  }
}
```

---

## 🧩 SaaS Modeli - Çoklu İşletme Yapısı

### 📄 businesses tablosu

| Alan         | Tip       | Açıklama              |
| ------------ | --------- | --------------------- |
| business\_id | uuid (PK) | İşletme kimliği       |
| name         | text      | İşletme adı           |
| owner\_id    | uuid      | Admin kullanıcı ID’si |

### 📄 user\_business tablosu (ilişkilendirme)

\| user\_id      | uuid      | | business\_id  | uuid      | | role         | text      | provider, customer vs.   |

### Flutter İşletme Seçim Ekranı

```dart
DropdownButton(
  value: selectedBiz,
  items: businesses.map((biz) => DropdownMenuItem(
    child: Text(biz.name),
    value: biz.id,
  )).toList(),
  onChanged: (val) => setState(() => selectedBiz = val),
);
```

### API ile çoklu işletmeye göre filtreleme

```python
@router.get("/appointments")
async def get_appointments(user_id: str, business_id: str):
    return db.query("""
        SELECT * FROM appointments
        WHERE user_id = :user_id AND business_id = :business_id
    """)
```

---

