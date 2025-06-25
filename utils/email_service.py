#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import smtplib
import ssl
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from typing import Optional
import os

from utils.logger import app_logger

class EmailService:
    """Email gönderme servisi"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'ZamanYönet Randevu Sistemi')
        
    def _create_connection(self):
        """SMTP bağlantısı oluştur"""
        try:
            context = ssl.create_default_context()
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls(context=context)
            
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            return server
        except Exception as e:
            app_logger.log_error('smtp_connection_error', str(e))
            raise
    
    def send_email(self, to_email: str, subject: str, html_content: str, 
                   text_content: Optional[str] = None) -> bool:
        """Email gönder"""
        try:
            if not self.smtp_username or not self.smtp_password:
                app_logger.log_warning('email_not_configured', 
                                     'SMTP credentials not configured')
                return False
            
            # Email oluştur
            message = MimeMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            # HTML ve text içerik ekle
            if text_content:
                part1 = MimeText(text_content, "plain")
                message.attach(part1)
            
            part2 = MimeText(html_content, "html")
            message.attach(part2)
            
            # Email gönder
            with self._create_connection() as server:
                server.sendmail(self.from_email, to_email, message.as_string())
            
            app_logger.log_business_event('email_sent', {
                'to_email': to_email,
                'subject': subject
            })
            
            return True
            
        except Exception as e:
            app_logger.log_error('email_send_error', str(e), {
                'to_email': to_email,
                'subject': subject
            })
            return False
    
    def send_password_reset_email(self, email: str, reset_token: str, 
                                user_name: str = None) -> bool:
        """Şifre sıfırlama emaili gönder"""
        try:
            # Frontend URL (environment variable'dan al)
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            reset_url = f"{frontend_url}/reset-password?token={reset_token}"
            
            subject = "Şifre Sıfırlama - ZamanYönet"
            
            # HTML template
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f9f9f9; }}
                    .button {{ display: inline-block; padding: 12px 24px; background-color: #007bff; 
                              color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
                    .warning {{ background-color: #fff3cd; border-left: 4px solid #ffeaa7; padding: 15px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>ZamanYönet Randevu Sistemi</h1>
                    </div>
                    <div class="content">
                        <h2>Şifre Sıfırlama Talebi</h2>
                        <p>Merhaba{' ' + user_name if user_name else ''},</p>
                        <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki bağlantıya tıklayarak 
                           yeni şifrenizi belirleyebilirsiniz:</p>
                        
                        <div style="text-align: center;">
                            <a href="{reset_url}" class="button">Şifremi Sıfırla</a>
                        </div>
                        
                        <div class="warning">
                            <strong>Önemli:</strong> Bu bağlantı güvenlik nedeniyle 1 saat sonra geçersiz olacaktır.
                            Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
                        </div>
                        
                        <p>Bağlantı çalışmıyorsa, aşağıdaki URL'yi tarayıcınıza kopyalayın:</p>
                        <p style="word-break: break-all; font-family: monospace; background-color: #f5f5f5; 
                           padding: 10px; border-radius: 3px;">{reset_url}</p>
                    </div>
                    <div class="footer">
                        <p>Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
                        <p>&copy; 2024 ZamanYönet Randevu Sistemi</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Text versiyonu
            text_content = f"""
            ZamanYönet Randevu Sistemi - Şifre Sıfırlama
            
            Merhaba{' ' + user_name if user_name else ''},
            
            Hesabınız için şifre sıfırlama talebinde bulundunuz.
            
            Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanın:
            {reset_url}
            
            Bu bağlantı güvenlik nedeniyle 1 saat sonra geçersiz olacaktır.
            Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
            
            ZamanYönet Ekibi
            """
            
            return self.send_email(email, subject, html_content, text_content)
            
        except Exception as e:
            app_logger.log_error('password_reset_email_error', str(e), {
                'email': email
            })
            return False
    
    def send_appointment_confirmation_email(self, email: str, appointment_data: dict) -> bool:
        """Randevu onay emaili gönder"""
        try:
            subject = "Randevu Onayı - ZamanYönet"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #28a745; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f9f9f9; }}
                    .appointment-details {{ background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Randevunuz Onaylandı!</h1>
                    </div>
                    <div class="content">
                        <h2>Randevu Detayları</h2>
                        <div class="appointment-details">
                            <p><strong>Hizmet:</strong> {appointment_data.get('service_name', 'Belirtilmemiş')}</p>
                            <p><strong>Hizmet Sağlayıcı:</strong> {appointment_data.get('provider_name', 'Belirtilmemiş')}</p>
                            <p><strong>Tarih:</strong> {appointment_data.get('appointment_date', 'Belirtilmemiş')}</p>
                            <p><strong>Saat:</strong> {appointment_data.get('appointment_time', 'Belirtilmemiş')}</p>
                            <p><strong>Süre:</strong> {appointment_data.get('duration', 'Belirtilmemiş')} dakika</p>
                            {f"<p><strong>Ücret:</strong> ₺{appointment_data.get('price', 0)}</p>" if appointment_data.get('price') else ""}
                            {f"<p><strong>Not:</strong> {appointment_data.get('notes', '')}</p>" if appointment_data.get('notes') else ""}
                        </div>
                        <p>Randevunuza zamanında gelmeyi unutmayın. Herhangi bir değişiklik için lütfen bizimle iletişime geçin.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 ZamanYönet Randevu Sistemi</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return self.send_email(email, subject, html_content)
            
        except Exception as e:
            app_logger.log_error('appointment_confirmation_email_error', str(e))
            return False

# Global email service instance
email_service = EmailService() 