#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import uuid
import random
from datetime import datetime, date, timedelta, timezone
from app import app, db, User, Service, Provider, Appointment, Staff, Shift

def add_test_data():
    """Test verileri ekler"""
    with app.app_context():
        print("Test verileri ekleniyor...")

        # Test kullanıcıları
        users_data = [
            {'id': 'admin-001', 'name': 'Admin User', 'email': 'admin@example.com', 'password': 'admin123', 'role_id': '1'},
            {'id': 'manager-001', 'name': 'Manager User', 'email': 'manager@example.com', 'password': 'manager123', 'role_id': '2'},
            {'id': 'provider-001', 'name': 'Dr. Ahmet Yılmaz', 'email': 'provider@example.com', 'password': 'provider123', 'role_id': '3'},
            {'id': 'provider-002', 'name': 'Dr. Ayşe Kaya', 'email': 'provider2@example.com', 'password': 'provider123', 'role_id': '3'},
            {'id': 'customer-001', 'name': 'Müşteri User', 'email': 'customer@example.com', 'password': 'customer123', 'role_id': '4'},
            {'id': 'customer-002', 'name': 'Mehmet Öz', 'email': 'mehmet@example.com', 'password': 'customer123', 'role_id': '4'},
            {'id': 'customer-003', 'name': 'Fatma Demir', 'email': 'fatma@example.com', 'password': 'customer123', 'role_id': '4'},
        ]

        # Kullanıcıları ekle
        for user_data in users_data:
            existing_user = User.query.filter(
                (User.id == user_data['id']) | 
                (User.email == user_data['email'])
            ).first()
            if not existing_user:
                user = User(**user_data)
                db.session.add(user)
                print(f"✓ Kullanıcı eklendi: {user_data['name']}")
            else:
                print(f"- Kullanıcı zaten var: {user_data['name']}")

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Kullanıcı commit hatası: {e}")

        # Provider'ları ekle
        providers_data = [
            {
                'id': 'provider-001',
                'user_id': 'provider-001',
                'business_name': 'Dr. Ahmet Yılmaz Kliniği',
                'description': 'Genel sağlık hizmetleri ve konsültasyon',
                'specialization': 'Genel Hekimlik',
                'experience_years': 10,
                'phone': '0532 123 4567',
                'address': 'Atatürk Cad. No:123 Ankara',
                'city': 'Ankara',
                'rating': 4.8,
                'total_reviews': 150,
                'is_verified': True,
                'is_active': True
            },
            {
                'id': 'provider-002',
                'user_id': 'provider-002',
                'business_name': 'Dr. Ayşe Kaya Dermatoloji',
                'description': 'Cilt hastalıkları ve estetik tedaviler',
                'specialization': 'Dermatoloji',
                'experience_years': 8,
                'phone': '0532 987 6543',
                'address': 'İstiklal Cad. No:456 İstanbul',
                'city': 'İstanbul',
                'rating': 4.9,
                'total_reviews': 200,
                'is_verified': True,
                'is_active': True
            }
        ]

        for provider_data in providers_data:
            existing_provider = Provider.query.filter_by(id=provider_data['id']).first()
            if not existing_provider:
                provider = Provider(**provider_data)
                db.session.add(provider)
                print(f"✓ Provider eklendi: {provider_data['business_name']}")
            else:
                print(f"- Provider zaten var: {provider_data['business_name']}")

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Provider commit hatası: {e}")

        # Hizmetleri ekle
        services_data = [
            {'id': 'service-001', 'name': 'Genel Muayene', 'description': 'Kapsamlı sağlık kontrolü', 'duration': 30, 'price': 200.00, 'provider_id': 'provider-001'},
            {'id': 'service-002', 'name': 'Kan Tahlili', 'description': 'Detaylı kan analizi', 'duration': 15, 'price': 150.00, 'provider_id': 'provider-001'},
            {'id': 'service-003', 'name': 'EKG', 'description': 'Elektrokardiyogram', 'duration': 20, 'price': 100.00, 'provider_id': 'provider-001'},
            {'id': 'service-004', 'name': 'Cilt Muayenesi', 'description': 'Cilt hastalıkları kontrolü', 'duration': 25, 'price': 250.00, 'provider_id': 'provider-002'},
            {'id': 'service-005', 'name': 'Botoks Tedavisi', 'description': 'Estetik botoks uygulaması', 'duration': 45, 'price': 800.00, 'provider_id': 'provider-002'},
            {'id': 'service-006', 'name': 'Lazer Epilasyon', 'description': 'Kalıcı tüy azaltma', 'duration': 60, 'price': 300.00, 'provider_id': 'provider-002'},
        ]

        for service_data in services_data:
            existing_service = Service.query.filter_by(id=service_data['id']).first()
            if not existing_service:
                service = Service(**service_data)
                db.session.add(service)
                print(f"✓ Hizmet eklendi: {service_data['name']}")
            else:
                print(f"- Hizmet zaten var: {service_data['name']}")

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Hizmet commit hatası: {e}")

        # Randevuları ekle
        today = date.today()
        appointments_data = []

        # Son 30 günde randevular
        for i in range(30):
            appointment_date = today - timedelta(days=i)
            for j in range(random.randint(2, 8)):  # Günde 2-8 randevu
                appointment_time = f"{random.randint(9, 17):02d}:{random.choice(['00', '30'])}"
                status = random.choice(['confirmed', 'completed', 'pending', 'cancelled'])
                
                appointments_data.append({
                    'id': str(uuid.uuid4()),
                    'customer_id': random.choice(['customer-001', 'customer-002', 'customer-003']),
                    'customer_name': random.choice(['Müşteri User', 'Mehmet Öz', 'Fatma Demir']),
                    'customer_email': random.choice(['customer@example.com', 'mehmet@example.com', 'fatma@example.com']),
                    'customer_phone': f"053{random.randint(1000000, 9999999)}",
                    'provider_id': random.choice(['provider-001', 'provider-002']),
                    'service_id': random.choice(['service-001', 'service-002', 'service-003', 'service-004', 'service-005', 'service-006']),
                    'appointment_date': appointment_date,
                    'appointment_time': appointment_time,
                    'notes': random.choice(['', 'Acil', 'Kontrol randevusu', 'İlk muayene']),
                    'status': status,
                    'is_guest': random.choice([True, False]),
                    'duration': random.choice([30, 45, 60]),
                    'location': random.choice(['Ankara', 'İstanbul']),
                    'price': random.uniform(100, 800),
                    'payment_status': random.choice(['paid', 'pending']),
                    'approval_level': random.choice([0, 1, 2]),
                    'approval_status': random.choice(['none', 'pending', 'approved'])
                })

        # Gelecek 15 günde randevular
        for i in range(1, 16):
            appointment_date = today + timedelta(days=i)
            for j in range(random.randint(3, 10)):  # Günde 3-10 randevu
                appointment_time = f"{random.randint(9, 17):02d}:{random.choice(['00', '30'])}"
                
                appointments_data.append({
                    'id': str(uuid.uuid4()),
                    'customer_id': random.choice(['customer-001', 'customer-002', 'customer-003']),
                    'customer_name': random.choice(['Müşteri User', 'Mehmet Öz', 'Fatma Demir']),
                    'customer_email': random.choice(['customer@example.com', 'mehmet@example.com', 'fatma@example.com']),
                    'customer_phone': f"053{random.randint(1000000, 9999999)}",
                    'provider_id': random.choice(['provider-001', 'provider-002']),
                    'service_id': random.choice(['service-001', 'service-002', 'service-003', 'service-004', 'service-005', 'service-006']),
                    'appointment_date': appointment_date,
                    'appointment_time': appointment_time,
                    'notes': random.choice(['', 'Acil', 'Kontrol randevusu', 'İlk muayene']),
                    'status': random.choice(['pending', 'confirmed']),
                    'is_guest': random.choice([True, False]),
                    'duration': random.choice([30, 45, 60]),
                    'location': random.choice(['Ankara', 'İstanbul']),
                    'price': random.uniform(100, 800),
                    'payment_status': 'pending',
                    'approval_level': random.choice([0, 1, 2]),
                    'approval_status': random.choice(['none', 'pending'])
                })

        # Randevuları ekle
        appointment_count = 0
        for appointment_data in appointments_data:
            existing_appointment = Appointment.query.filter_by(id=appointment_data['id']).first()
            if not existing_appointment:
                appointment = Appointment(**appointment_data)
                db.session.add(appointment)
                appointment_count += 1

        try:
            db.session.commit()
            if appointment_count > 0:
                print(f"✓ {appointment_count} randevu eklendi")
            else:
                print(f"- Randevular zaten mevcut")
        except Exception as e:
            db.session.rollback()
            print(f"Randevu commit hatası: {e}")

        # Staff ekleri
        staff_data = [
            {
                'id': 'staff-001',
                'provider_id': 'provider-001',
                'user_id': 'provider-001',
                'position': 'Baş Hekim',
                'department': 'Genel Tıp',
                'hire_date': date(2020, 1, 15),
                'salary': 15000.00,
                'is_active': True,
                'permissions': '{"appointments": true, "patients": true}'
            },
            {
                'id': 'staff-002',
                'provider_id': 'provider-002',
                'user_id': 'provider-002',
                'position': 'Uzman Doktor',
                'department': 'Dermatoloji',
                'hire_date': date(2021, 3, 1),
                'salary': 12000.00,
                'is_active': True,
                'permissions': '{"appointments": true, "treatments": true}'
            }
        ]

        for staff_item in staff_data:
            existing_staff = Staff.query.filter_by(id=staff_item['id']).first()
            if not existing_staff:
                staff = Staff(**staff_item)
                db.session.add(staff)
                print(f"✓ Personel eklendi: {staff_item['position']}")
            else:
                print(f"- Personel zaten var: {staff_item['position']}")

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Staff commit hatası: {e}")

        print("\n🎉 Test verileri başarıyla eklendi!")
        print("=" * 50)
        print("Test Kullanıcı Bilgileri:")
        print("Admin    : admin@example.com / admin123")
        print("Manager  : manager@example.com / manager123")
        print("Provider : provider@example.com / provider123")
        print("Customer : customer@example.com / customer123")
        print("=" * 50)

if __name__ == "__main__":
    add_test_data() 