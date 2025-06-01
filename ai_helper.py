from openai import OpenAI
from dotenv import load_dotenv
import os

class AIHelper:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    def analyze_appointment(self, appointment_details):
        """
        Randevu detaylarını analiz eder ve öneriler sunar
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Sen bir randevu asistanısın. Randevu detaylarını analiz edip, öneriler sunacaksın."},
                    {"role": "user", "content": f"Lütfen bu randevu detaylarını analiz et ve öneriler sun: {appointment_details}"}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI analizi sırasında bir hata oluştu: {str(e)}"

    def suggest_time_slots(self, user_preferences):
        """
        Kullanıcı tercihlerine göre uygun randevu saatleri önerir
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Sen bir randevu planlama asistanısın. Kullanıcı tercihlerine göre en uygun randevu saatlerini önereceksin."},
                    {"role": "user", "content": f"Bu tercihlere göre uygun randevu saatleri öner: {user_preferences}"}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Randevu saati önerisi sırasında bir hata oluştu: {str(e)}"

    def summarize_appointment(self, appointment_text):
        """
        Randevu detaylarını özetler
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Sen bir randevu özetleme asistanısın. Randevu detaylarını kısa ve öz bir şekilde özetleyeceksin."},
                    {"role": "user", "content": f"Bu randevu detaylarını özetle: {appointment_text}"}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Randevu özetleme sırasında bir hata oluştu: {str(e)}" 