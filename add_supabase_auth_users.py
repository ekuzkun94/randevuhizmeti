import requests
import json

# Supabase bilgileri - Gerçek değerler
SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"

def create_user(email, password, user_metadata=None):
    """Supabase Auth'a kullanıcı ekler"""
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "email": email,
        "password": password,
        "email_confirm": True,  # E-posta doğrulamasını otomatik yap
        "user_metadata": user_metadata or {}
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            print(f"✅ {email}: Başarıyla eklendi")
            return True
        else:
            print(f"❌ {email}: Hata - {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ {email}: Bağlantı hatası - {str(e)}")
        return False

def main():
    print("🚀 Supabase Auth'a kullanıcı ekleme başlatılıyor...")
    print(f"📡 URL: {SUPABASE_URL}")
    print("-" * 50)
    
    # Test kullanıcıları
    users = [
        {
            "email": "admin@zamanyonet.com",
            "password": "123456",
            "metadata": {"role": "admin", "name": "Admin User"}
        },
        {
            "email": "guzellik@salon.com", 
            "password": "123456",
            "metadata": {"role": "provider", "name": "Güzellik Salonu"}
        },
        {
            "email": "spa@merkezi.com",
            "password": "123456", 
            "metadata": {"role": "provider", "name": "SPA Merkezi"}
        },
        {
            "email": "berber@dukkani.com",
            "password": "123456",
            "metadata": {"role": "provider", "name": "Berber Dükkanı"}
        },
        {
            "email": "musteri1@email.com",
            "password": "123456",
            "metadata": {"role": "customer", "name": "Müşteri 1"}
        },
        {
            "email": "musteri2@email.com",
            "password": "123456",
            "metadata": {"role": "customer", "name": "Müşteri 2"}
        },
        {
            "email": "musteri3@email.com",
            "password": "123456",
            "metadata": {"role": "customer", "name": "Müşteri 3"}
        }
    ]
    
    success_count = 0
    total_count = len(users)
    
    for user in users:
        success = create_user(
            email=user["email"],
            password=user["password"],
            user_metadata=user["metadata"]
        )
        if success:
            success_count += 1
    
    print("-" * 50)
    print(f"📊 Sonuç: {success_count}/{total_count} kullanıcı başarıyla eklendi")
    
    if success_count == total_count:
        print("🎉 Tüm kullanıcılar başarıyla eklendi!")
        print("\n📝 Test kullanıcıları:")
        for user in users:
            print(f"   • {user['email']} / {user['password']}")
    else:
        print("⚠️  Bazı kullanıcılar eklenemedi. Hataları kontrol edin.")

if __name__ == "__main__":
    main() 