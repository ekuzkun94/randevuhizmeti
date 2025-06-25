#!/usr/bin/env python3
"""
🚀 Supabase Production Configuration
Ready-to-use Supabase settings for production deployment
"""

import os

class SupabaseConfig:
    """Production-ready Supabase configuration"""
    
    # 🔗 Supabase Credentials (Updated 2025-06-25)
    SUPABASE_URL = "https://ugmyyphiqoahludwuzpu.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODYxOTUsImV4cCI6MjA2NjM2MjE5NX0.n3FmnmMjVqvodqmnvf1g74pACaZuiZ4SYw7oVMekyoc"
    SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXl5cGhpcW9haGx1ZHd1enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4NjE5NSwiZXhwIjoyMDY2MzYyMTk1fQ.Owy1Ps0tWq5JiqMM27vpsrp-N6KJoQvwwFPGCxy98QI"
    SUPABASE_PASSWORD = "*RasT_1385*!"
    
    # 🔗 Database Connection Strings (Multiple Options)
    DATABASE_CONFIGS = {
        'pooler_primary': {
            'host': 'aws-0-eu-central-1.pooler.supabase.com',
            'port': 6543,
            'user': 'postgres.ugmyyphiqoahludwuzpu',
            'database': 'postgres',
            'url': f"postgresql+pg8000://postgres.ugmyyphiqoahludwuzpu:{SUPABASE_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
        },
        'pooler_alternative': {
            'host': 'aws-0-eu-central-1.pooler.supabase.com',
            'port': 6543,
            'user': 'postgres',
            'database': 'postgres',
            'url': f"postgresql+pg8000://postgres:{SUPABASE_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
        },
        'direct': {
            'host': 'db.ugmyyphiqoahludwuzpu.supabase.co',
            'port': 5432,
            'user': 'postgres',
            'database': 'postgres',
            'url': f"postgresql+pg8000://postgres:{SUPABASE_PASSWORD}@db.ugmyyphiqoahludwuzpu.supabase.co:5432/postgres"
        }
    }
    
    # 🎯 Primary Database URL (for production)
    DATABASE_URL = DATABASE_CONFIGS['pooler_primary']['url']
    
    # 🔧 Production SQLAlchemy Settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,      # 5 minutes
        'pool_timeout': 20,       # 20 seconds
        'pool_size': 10,          # Connection pool size
        'max_overflow': 20        # Max overflow connections
    }
    
    # 🌍 Environment Variables Template
    ENV_TEMPLATE = f"""
# 🚀 Supabase Production Environment Variables
# Copy these to your production environment

DATABASE_URL={DATABASE_URL}
SUPABASE_URL={SUPABASE_URL}
SUPABASE_ANON_KEY={SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY={SUPABASE_SERVICE_KEY}
SUPABASE_PASSWORD={SUPABASE_PASSWORD}

# 🔑 Security (Generate new keys for production!)
SECRET_KEY=your-super-secret-production-key
JWT_SECRET_KEY=your-jwt-secret-production-key

# 🔧 Flask Settings
FLASK_ENV=production
DEBUG=false

# 📧 Email Settings (Optional)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
"""
    
    @classmethod
    def get_render_config(cls):
        """Get Render.com deployment configuration"""
        return {
            'name': 'zamanyonet-api',
            'type': 'web',
            'env': 'python',
            'region': 'oregon',
            'plan': 'starter',
            'buildCommand': 'pip install -r requirements_supabase_production.txt',
            'startCommand': 'gunicorn app_supabase_production:app --bind 0.0.0.0:$PORT',
            'envVars': [
                {'key': 'DATABASE_URL', 'value': cls.DATABASE_URL},
                {'key': 'SUPABASE_URL', 'value': cls.SUPABASE_URL},
                {'key': 'SUPABASE_ANON_KEY', 'value': cls.SUPABASE_ANON_KEY},
                {'key': 'SUPABASE_SERVICE_ROLE_KEY', 'value': cls.SUPABASE_SERVICE_KEY},
                {'key': 'SUPABASE_PASSWORD', 'value': cls.SUPABASE_PASSWORD},
                {'key': 'FLASK_ENV', 'value': 'production'},
                {'key': 'DEBUG', 'value': 'false'}
            ]
        }
    
    @classmethod
    def export_env_file(cls):
        """Export environment variables to .env.production file"""
        with open('.env.production', 'w') as f:
            f.write(cls.ENV_TEMPLATE)
        print("✅ .env.production file created!")
        print("📋 Copy these variables to your production environment")

if __name__ == "__main__":
    print("🚀 Supabase Configuration for ZamanYönet")
    print("=" * 50)
    
    config = SupabaseConfig()
    
    print(f"🌐 Supabase URL: {config.SUPABASE_URL}")
    print(f"🔑 Anon Key: {config.SUPABASE_ANON_KEY[:20]}...")
    print(f"🔗 Database URL: {config.DATABASE_URL[:60]}...")
    
    print(f"\n📦 Available Database Configs:")
    for name, conf in config.DATABASE_CONFIGS.items():
        print(f"  • {name}: {conf['host']}:{conf['port']}")
    
    # Export environment file
    config.export_env_file()
    
    print(f"\n🎯 Ready for production deployment!") 