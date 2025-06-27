import requests
import uuid
import bcrypt
import time

SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
# Service Role Key (do not share publicly)
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"

headers = {
    "apikey": SUPABASE_API_KEY,
    "Authorization": f"Bearer {SUPABASE_API_KEY}",
    "Content-Type": "application/json"
}

def get_role_id(role_name):
    url = f"{SUPABASE_URL}/rest/v1/roles?name=eq.{role_name}&select=id"
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    return resp.json()[0]['id']

def get_user_by_email(email):
    url = f"{SUPABASE_URL}/rest/v1/users?email=eq.{email}&select=id"
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    users = resp.json()
    return users[0]['id'] if users else None

def add_user(email, password, first_name, last_name, role_id):
    # Check if user already exists
    existing_user_id = get_user_by_email(email)
    if existing_user_id:
        print(f"User {email} already exists with ID: {existing_user_id}")
        return existing_user_id
    
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user_data = {
        "email": email,
        "password_hash": password_hash,
        "first_name": first_name,
        "last_name": last_name,
        "role_id": role_id,
        "is_active": True,
        "email_verified": True
    }
    url = f"{SUPABASE_URL}/rest/v1/users"
    resp = requests.post(url, headers=headers, json=user_data)
    print(f"Add user {email}: {resp.status_code}")
    
    if resp.status_code == 201:
        # If response is empty, get the user by email
        if not resp.text.strip():
            return get_user_by_email(email)
        else:
            return resp.json()[0]['id']
    
    resp.raise_for_status()
    return None

def add_provider(user_id, business_name, description, specialization, phone, address, city):
    # Check if provider already exists for this user
    url = f"{SUPABASE_URL}/rest/v1/providers?user_id=eq.{user_id}"
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    existing_providers = resp.json()
    
    if existing_providers:
        print(f"Provider already exists for user {user_id}")
        return existing_providers[0]['id']
    
    # Use only fields that exist in the providers table schema
    provider_data = {
        "user_id": user_id,
        "business_name": business_name,
        "bio": description,  # Use 'bio' instead of 'description'
        "specialization": specialization,
        "experience_years": 5,
        "address": address,
        "city": city,
        "is_active": True
    }
    url = f"{SUPABASE_URL}/rest/v1/providers"
    resp = requests.post(url, headers=headers, json=provider_data)
    print(f"Add provider {business_name}: {resp.status_code}")
    
    if resp.status_code == 201:
        print(f"Provider {business_name} created successfully!")
        # Get the provider ID by querying the database
        provider_url = f"{SUPABASE_URL}/rest/v1/providers?user_id=eq.{user_id}&select=id"
        provider_resp = requests.get(provider_url, headers=headers)
        if provider_resp.status_code == 200 and provider_resp.json():
            return provider_resp.json()[0]['id']
        return None
    else:
        print(f"Error response: {resp.text}")
        resp.raise_for_status()
        return None

if __name__ == "__main__":
    try:
        print("Getting role IDs...")
        provider_role_id = get_role_id("provider")
        customer_role_id = get_role_id("customer")
        print(f"Provider role ID: {provider_role_id}")
        print(f"Customer role ID: {customer_role_id}")

        # Get or create provider user
        print("\nGetting/Creating provider user...")
        provider_user_id = get_user_by_email("provider1@example.com")
        if not provider_user_id:
            provider_user_id = add_user(
                email="provider1@example.com",
                password="123456",
                first_name="Ayşe",
                last_name="Yılmaz",
                role_id=provider_role_id
            )
        
        if provider_user_id:
            print(f"Provider user ID: {provider_user_id}")
            # Add provider profile
            print("Adding provider profile...")
            add_provider(
                user_id=provider_user_id,
                business_name="Güzellik Salonu",
                description="Profesyonel güzellik hizmetleri",
                specialization="Saç ve Güzellik",
                phone="+90 555 000 0002",
                address="Merkez Mah. Güzellik Sok. No:15",
                city="İstanbul"
            )
        else:
            print("Failed to get/create provider user")

        # Add sample customer user
        print("\nAdding customer user...")
        customer_user_id = add_user(
            email="customer1@example.com",
            password="123456",
            first_name="Mehmet",
            last_name="Kaya",
            role_id=customer_role_id
        )
        
        if customer_user_id:
            print(f"Customer user created with ID: {customer_user_id}")
        else:
            print("Failed to create customer user")

        print("\nSample data addition completed!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc() 