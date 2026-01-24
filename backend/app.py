import os
import datetime
import json
import time

from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

from db import get_db_connection
from psycopg2.extras import RealDictCursor

from encryption import encrypt, decrypt
import joblib
import pandas as pd
import numpy as np

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = 3001
# Use same JWT secret as Node for compatibility, though usually secrets are env vars
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "232841381092-8c1brgamv08b833qbn7t8fg7cgoi3vsa.apps.googleusercontent.com")

def generate_token(user_id, email):
    payload = {
        'id': user_id,
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def encrypt_educations(educations):
    if not educations or not isinstance(educations, list):
        return educations
    
    encrypted_list = []
    for edu in educations:
        new_edu = edu.copy()
        new_edu['university'] = encrypt(edu.get('university', ''))
        new_edu['specialization'] = encrypt(edu.get('specialization', ''))
        # Encrypt CGPA as string
        if 'cgpa' in edu:
             new_edu['cgpa'] = encrypt(str(edu['cgpa']))
        encrypted_list.append(new_edu)
    return encrypted_list

def decrypt_educations(educations):
    if not educations or not isinstance(educations, list):
        return educations
    
    decrypted_list = []
    for edu in educations:
        new_edu = edu.copy()
        new_edu['university'] = decrypt(edu.get('university', ''))
        new_edu['specialization'] = decrypt(edu.get('specialization', ''))
        # Decrypt CGPA and convert back to float/string
        if 'cgpa' in edu:
            try:
                decrypted_cgpa = decrypt(edu['cgpa'])
                new_edu['cgpa'] = decrypted_cgpa # Return as string, frontend/ML handles type
            except:
                 new_edu['cgpa'] = edu['cgpa']
        decrypted_list.append(new_edu)
    return decrypted_list
def process_user_for_response(user_dict):
    if not user_dict:
        return None
    
    # Remove password
    if 'password' in user_dict:
        del user_dict['password']
    
    # Parse and Decrypt Educations
    educations = user_dict.get('educations', [])
    if isinstance(educations, str):
        try:
            educations = json.loads(educations)
        except:
            educations = []
    if isinstance(educations, list):
         user_dict['educations'] = decrypt_educations(educations)
    else:
        user_dict['educations'] = []

    # Parse other JSON fields
    json_fields = ['certifications', 'skills', 'placementStatus']
    for field in json_fields:
        val = user_dict.get(field, [])
        if isinstance(val, str):
            try:
                user_dict[field] = json.loads(val)
            except:
                user_dict[field] = []
        elif val is None:
             user_dict[field] = []
            
    return user_dict

# --- ML Model Loading ---
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'ML_model')
model = None
encoders = {}

def load_ml_artifacts():
    global model, encoders
    try:
        print("Loading ML model and encoders...")
        model_path = os.path.join(MODEL_DIR, 'job_role_model.joblib')
        if os.path.exists(model_path):
            model = joblib.load(model_path)
        
        encoder_files = [
            'degree', 'specialization', 'programming_skill_level', 
            'internship_experience', 'certifications', 'job_role'
        ]
        
        for name in encoder_files:
            enc_path = os.path.join(MODEL_DIR, f'encoder_{name}.joblib')
            if os.path.exists(enc_path):
                encoders[name] = joblib.load(enc_path)
                
        print("ML artifacts loaded successfully.")
    except Exception as e:
        print(f"Error loading ML artifacts: {e}")

# Load artifacts on startup
load_ml_artifacts()

# --- Routes ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return jsonify({'success': False, 'message': 'Please provide all required fields'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_id = str(int(time.time() * 1000))
        created_at = datetime.datetime.now()
        
        # New user template
        new_user = {
            'id': user_id,
            'name': name,
            'email': email,
            'password': hashed_password,
            'createdAt': created_at,
            'educations': json.dumps([]),
            'certifications': json.dumps([]),
            'skills': json.dumps([]),
            'placementStatus': json.dumps([])
        }
        
        query = """
        INSERT INTO users (id, name, email, password, createdAt, educations, certifications, skills, placementStatus) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            new_user['id'], new_user['name'], new_user['email'], new_user['password'],
            new_user['createdAt'], new_user['educations'], new_user['certifications'], 
            new_user['skills'], new_user['placementStatus']
        ))
        conn.commit()
        cursor.close()
        conn.close()
        
        token = generate_token(user_id, email)
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'data': {
                'id': user_id, 'name': name, 'email': email, 
                'createdAt': created_at, 
                'educations': [], 'certifications': [], 'skills': [], 'placementStatus': []
            },
            'token': token
        }), 201

    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'success': False, 'message': 'Failed to create account'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'success': False, 'message': 'Please provide email and password'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
             return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        # Check password
        # stored password is hash string, need bytes for checkpw works? 
        # bcrypt.checkpw(password_bytes, hashed_password_bytes)
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

        token = generate_token(user['id'], user['email'])
        user_data = process_user_for_response(user)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': user_data,
            'token': token
        })

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

@app.route('/api/google-login', methods=['POST'])
def google_login():
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
             return jsonify({'success': False, 'message': 'Token is required'}), 400
             
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        name = idinfo.get('name')
        sub = idinfo['sub'] # Google ID
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            # Create new user
            user_id = str(int(time.time() * 1000))
            created_at = datetime.datetime.now()
            
            # Setup user object for insertion
            user = {
                'id': user_id, 'name': name, 'email': email, 'password': '', 
                'googleId': sub, 'createdAt': created_at,
                'educations': [], 'certifications': [], 'skills': [], 'placementStatus': []
            } # Keeping dict format for response later
            
            query = """
            INSERT INTO users (id, name, email, password, googleId, createdAt, educations, certifications, skills, placementStatus) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                user['id'], user['name'], user['email'], user['password'], user['googleId'],
                user['createdAt'], json.dumps(user['educations']), json.dumps(user['certifications']), 
                json.dumps(user['skills']), json.dumps(user['placementStatus'])
            ))
            conn.commit()
        else:
            # Update googleId if missing
            if not user.get('googleId'):
                cursor.execute("UPDATE users SET googleId = %s WHERE id = %s", (sub, user['id']))
                conn.commit()
                user['googleId'] = sub

        cursor.close()
        conn.close()
        
        token = generate_token(user['id'], user['email'])
        user_data = process_user_for_response(user)
        
        return jsonify({
            'success': True,
            'message': 'Google login successful',
            'data': user_data,
            'token': token
        })

    except ValueError:
         return jsonify({'success': False, 'message': 'Invalid token'}), 401
    except Exception as e:
        print(f"Google login error: {e}")
        return jsonify({'success': False, 'message': 'Google authentication failed'}), 401

@app.route('/api/user/<string:id>', methods=['GET'])
def get_user(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE id = %s", (id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        user_data = process_user_for_response(user)
        return jsonify({'success': True, 'data': user_data})

    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch user'}), 500

@app.route('/api/user/<string:id>', methods=['PUT', 'OPTIONS'])
def update_user(id):
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE id = %s", (id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
        name = data.get('name')
        email = data.get('email')
        educations = data.get('educations')
        certifications = data.get('certifications')
        skills = data.get('skills')
        placement_status = data.get('placementStatus')
        new_password = data.get('newPassword')
        
        query_parts = []
        params = []
        
        if name:
            query_parts.append("name = %s")
            params.append(name)
        if email:
            query_parts.append("email = %s")
            params.append(email)
        if educations is not None:
            encrypted_educations = encrypt_educations(educations)
            query_parts.append("educations = %s")
            params.append(json.dumps(encrypted_educations))
        if certifications is not None:
            query_parts.append("certifications = %s")
            params.append(json.dumps(certifications))
        if skills is not None:
             query_parts.append("skills = %s")
             params.append(json.dumps(skills))
        if placement_status is not None:
             query_parts.append("placementStatus = %s")
             params.append(json.dumps(placement_status))
        if new_password:
             hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
             query_parts.append("password = %s")
             params.append(hashed)
             
        if query_parts:
            sql = f"UPDATE users SET {', '.join(query_parts)} WHERE id = %s"
            params.append(id)
            cursor.execute(sql, tuple(params))
            conn.commit()
            
        # Fetch updated user
        cursor.execute("SELECT * FROM users WHERE id = %s", (id,))
        updated_user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        user_data = process_user_for_response(updated_user)
        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'data': user_data
        })

    except Exception as e:
        print(f"Update user error: {e}")
        return jsonify({'success': False, 'message': 'Failed to update user'}), 500

@app.route('/api/user/<string:id>', methods=['DELETE'])
def delete_user(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s", (id,))
        rows_affected = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        
        if rows_affected == 0:
             return jsonify({'success': False, 'message': 'User not found'}), 404
             
        return jsonify({'success': True, 'message': 'Account deleted successfully'})

    except Exception as e:
        print(f"Delete user error: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete account'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Server is running'})

@app.route('/api/predict-role', methods=['POST'])
def predict_role():
    try:
        data = request.get_json()
        
        # Required fields in order: degree, specialization, programming_skill_level, internship_experience, certifications, project_count
        # Mapping frontend data to model features
        
        # Required features: degree, specialization, cgpa
        
        # 1. Degree
        degree = data.get('degree', 'B.Tech') 
        
        # 2. Specialization
        specialization = data.get('specialization', 'Computer Science')
        
        # 3. CGPA
        # Ensure CGPA is a float for the model
        try:
            cgpa = float(data.get('cgpa', 5.0))
        except (ValueError, TypeError):
             cgpa = 5.0
             
        # Prepare feature vector
        features = pd.DataFrame([{
            'degree': degree,
            'specialization': specialization,
            'cgpa': cgpa
        }])
        
        # Encode features
        # Assuming numerical features like cgpa don't need label encoding if model handles it or they were skipped in training
        for col, encoder in encoders.items():
            if col in features.columns and col != 'cgpa':
                try:
                    features[col] = encoder.transform(features[col])
                except ValueError:
                    # Fallback for unseen label
                     # It's better to assign a known category or handle it gracefully. 
                     # Here taking 0 index as backup.
                     # Ideally we should use encoder.classes_ to find a mode or 'Other'
                    features[col] = 0

        # Predict
        if model:
            prediction_idx = model.predict(features)[0]
            predicted_role = encoders['job_role'].inverse_transform([prediction_idx])[0]
            
            return jsonify({
                'success': True, 
                'predicted_role': predicted_role,
                'details': {
                   'degree': degree,
                   'specialization': specialization,
                   'cgpa': cgpa
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Model not loaded'}), 500

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'success': False, 'message': 'Prediction failed'}), 500

if __name__ == '__main__':
    # Initialize DB before running
    # init_db()  <-- Removed
    app.run(port=PORT, debug=True)
