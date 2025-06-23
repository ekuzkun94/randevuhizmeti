#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from datetime import datetime, date, timedelta, timezone
import requests

def add_simple_test_data():
    """Basit test verileri API ile ekler"""
    base_url = "http://localhost:5001"
    
    print("Basit test verileri ekleniyor...")
    
    # Test randevuları ekle
    appointments = [
        {
            "customer_name": "Test Müşteri 1",
            "customer_email": "test1@example.com",
            "customer_phone": "0532 111 1111",
            "provider_id": "provider-001",
            "service_id": "service-001",
            "appointment_date": "2025-06-25",
            "appointment_time": "10:00",
            "notes": "Test randevusu",
            "status": "confirmed",
            "duration": 30,
            "price": 200.00
        },
        {
            "customer_name": "Test Müşteri 2",
            "customer_email": "test2@example.com", 
            "customer_phone": "0532 222 2222",
            "provider_id": "provider-002",
            "service_id": "service-004",
            "appointment_date": "2025-06-26",
            "appointment_time": "14:00",
            "notes": "Kontrol randevusu",
            "status": "pending",
            "duration": 25,
            "price": 250.00
        },
        {
            "customer_name": "Test Müşteri 3",
            "customer_email": "test3@example.com",
            "customer_phone": "0532 333 3333", 
            "provider_id": "provider-001",
            "service_id": "service-002",
            "appointment_date": "2025-06-24",
            "appointment_time": "16:30",
            "notes": "",
            "status": "completed",
            "duration": 15,
            "price": 150.00
        }
    ]
    
    # Randevuları ekle
    for appointment in appointments:
        try:
            response = requests.post(f"{base_url}/appointments", json=appointment)
            if response.status_code == 201:
                print(f"✓ Randevu eklendi: {appointment['customer_name']}")
            else:
                print(f"- Randevu eklenemedi: {response.status_code}")
        except Exception as e:
            print(f"API hatası: {e}")
    
    print("\n🎉 Basit test verileri eklendi!")
    print("Artık uygulamada randevuları görebilirsiniz.")

if __name__ == "__main__":
    add_simple_test_data()