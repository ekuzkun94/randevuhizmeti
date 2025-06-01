from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from ai_helper import AIHelper
from dotenv import load_dotenv
from flask_cors import CORS
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # CORS desteği eklendi

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@{os.getenv('MYSQL_HOST')}/{os.getenv('MYSQL_DATABASE')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
ai_helper = AIHelper()

# Ana sayfa route'u
@app.route('/', methods=['GET'])
def home():
    try:
        return jsonify({
            'status': 'success',
            'message': 'Randevu API çalışıyor',
            'endpoints': {
                'GET /appointments': 'Tüm randevuları listele',
                'POST /appointments': 'Yeni randevu oluştur',
                'PUT /appointments/<id>': 'Randevu güncelle',
                'DELETE /appointments/<id>': 'Randevu sil',
                'POST /appointments/suggest': 'Randevu önerisi al'
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Model tanımlamaları
class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    date_time = db.Column(db.DateTime, nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ai_summary = db.Column(db.Text)

# API Routes
@app.route('/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    try:
        # AI ile randevu analizi
        ai_analysis = ai_helper.analyze_appointment(f"{data['title']} - {data['description']}")
        
        appointment = Appointment(
            title=data['title'],
            description=data['description'],
            date_time=datetime.fromisoformat(data['date_time']),
            user_name=data['user_name'],
            ai_summary=ai_analysis
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Randevu başarıyla oluşturuldu',
            'appointment_id': appointment.id,
            'ai_analysis': ai_analysis
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/appointments', methods=['GET'])
def get_appointments():
    appointments = Appointment.query.all()
    return jsonify([{
        'id': a.id,
        'title': a.title,
        'description': a.description,
        'date_time': a.date_time.isoformat(),
        'user_name': a.user_name,
        'status': a.status,
        'ai_summary': a.ai_summary
    } for a in appointments])

@app.route('/appointments/suggest', methods=['POST'])
def suggest_appointment_times():
    data = request.json
    suggestions = ai_helper.suggest_time_slots(data['preferences'])
    return jsonify({'suggestions': suggestions})

@app.route('/appointments/<int:id>', methods=['PUT'])
def update_appointment(id):
    appointment = Appointment.query.get_or_404(id)
    data = request.json
    
    try:
        if 'title' in data:
            appointment.title = data['title']
        if 'description' in data:
            appointment.description = data['description']
        if 'date_time' in data:
            appointment.date_time = datetime.fromisoformat(data['date_time'])
        if 'status' in data:
            appointment.status = data['status']
            
        # Güncellenen randevu için yeni AI analizi
        ai_analysis = ai_helper.analyze_appointment(f"{appointment.title} - {appointment.description}")
        appointment.ai_summary = ai_analysis
        
        db.session.commit()
        return jsonify({
            'message': 'Randevu güncellendi',
            'ai_analysis': ai_analysis
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/appointments/<int:id>', methods=['DELETE'])
def delete_appointment(id):
    appointment = Appointment.query.get_or_404(id)
    try:
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({'message': 'Randevu silindi'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 