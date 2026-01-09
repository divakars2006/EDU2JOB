import os
import sqlite3
import json
import datetime
import joblib
import pandas as pd
import numpy as np
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
# Auth Imports
import bcrypt
import jwt
import time
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
CORS(app)

# Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')
DATASET_PATH = os.path.join(os.path.dirname(__file__), 'backend_python', 'ML_model', 'job_roles_dataset.tsv')
TRAINING_SCRIPT_PATH = os.path.join(os.path.dirname(__file__), 'backend_python', 'ML_model', 'train_model.py')
PORT = 5000
GOOGLE_CLIENT_ID = "232841381092-8c1brgamv08b833qbn7t8fg7cgoi3vsa.apps.googleusercontent.com"

# Global artifacts
model = None
encoders = {}

# Heuristic-based Skill Map
ROLE_SKILLS_MAP = {
    'ML Engineer': ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'TensorFlow', 'Keras'],
    'Software Developer': ['Java', 'Python', 'JavaScript', 'React', 'SQL', 'Git', 'Node.js'],
    'Data Scientist': ['Python', 'R', 'SQL', 'Data Visualization', 'Statistics', 'Machine Learning', 'Pandas'],
    'Business Analyst': ['SQL', 'Excel', 'Tableau', 'Power BI', 'Python', 'Data Analysis']
}

def calculate_missing_skills(user_skills, role):
    """
    Calculate missing skills for a given role based on user's current skills.
    Returns a set of missing skills.
    """
    required_skills = ROLE_SKILLS_MAP.get(role, [])
    if not required_skills:
        return []
    
    # Normalize for comparison (case-insensitive)
    user_skills_norm = {s.lower().strip() for s in user_skills}
    missing = []
    
    for skill in required_skills:
        if skill.lower().strip() not in user_skills_norm:
            missing.append(skill)
            
    return missing

# Auth Helpers
JWT_SECRET = "your-secret-key-change-in-production"

def generate_token(user_id, email):
    payload = {
        'id': user_id,
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def process_user_for_response(user):
    """
    Format user data for frontend. 
    User can be a sqlite3.Row or a dict.
    """
    if not user:
        return None
    
    # Convert Row to dict if needed
    user_dict = dict(user) if isinstance(user, sqlite3.Row) else user.copy()
    
    # Remove password
    if 'password' in user_dict:
        del user_dict['password']
    
    # Parse JSON fields
    # SQLite stores them as TEXT, so we need to json.loads them if they are strings
    json_fields = ['educations', 'certifications', 'skills', 'placementStatus']
    for field in json_fields:
        val = user_dict.get(field, [])
        if isinstance(val, str) and val:
            try:
                user_dict[field] = json.loads(val)
            except:
                user_dict[field] = []
        elif val is None:
             user_dict[field] = []
            
    return user_dict

def init_db():
    """Initialize the SQLite database for prediction history and admin users."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            confidence REAL,
            explanation TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            flagged INTEGER DEFAULT 0
        )
    ''')
    
    # Check if flagged column exists (for migration)
    cursor.execute("PRAGMA table_info(history)")
    columns = [info[1] for info in cursor.fetchall()]
    if 'flagged' not in columns:
        print("Migrating DB: Adding 'flagged' column to history table...")
        try:
            cursor.execute("ALTER TABLE history ADD COLUMN flagged INTEGER DEFAULT 0")
        except sqlite3.OperationalError as e:
            print(f"Migration warning: {e}")

    # Check for new columns: degree and specialization
    if 'degree' not in columns:
        print("Migrating DB: Adding 'degree' column to history table...")
        try:
             cursor.execute("ALTER TABLE history ADD COLUMN degree TEXT")
        except sqlite3.OperationalError as e:
             print(f"Migration warning: {e}")

    if 'specialization' not in columns:
        print("Migrating DB: Adding 'specialization' column to history table...")
        try:
             cursor.execute("ALTER TABLE history ADD COLUMN specialization TEXT")
        except sqlite3.OperationalError as e:
             print(f"Migration warning: {e}")

    # Admin Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Seed default admin
    cursor.execute("SELECT * FROM admin_users WHERE username = ?", ('admin',))
    if not cursor.fetchone():
        print("Seeding default admin user...")
        # In a real app, hash password!
        cursor.execute("INSERT INTO admin_users (username, password) VALUES (?, ?)", ('admin', 'admin123'))

    # Seed requested admin (Exact match as requested)
    cursor.execute("SELECT * FROM admin_users WHERE username = ?", ('Adimn@info.com',))
    if not cursor.fetchone():
        print("Seeding requested admin user...")
        cursor.execute("INSERT INTO admin_users (username, password) VALUES (?, ?)", ('Adimn@info.com', '654321'))

    # Seed corrected spelling (Admin@info.com) just in case
    cursor.execute("SELECT * FROM admin_users WHERE username = ?", ('Admin@info.com',))
    if not cursor.fetchone():
        print("Seeding corrected admin user...")
        cursor.execute("INSERT INTO admin_users (username, password) VALUES (?, ?)", ('Admin@info.com', '654321'))

    # Seed lowercase version (admin@info.com) for usability
    cursor.execute("SELECT * FROM admin_users WHERE username = ?", ('admin@info.com',))
    if not cursor.fetchone():
        print("Seeding lowercase admin user...")
        cursor.execute("INSERT INTO admin_users (username, password) VALUES (?, ?)", ('admin@info.com', '654321'))

    # Feedback Table (New)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            prediction_id INTEGER,
            predicted_role TEXT NOT NULL,
            relevance_rating INTEGER NOT NULL,
            confidence_agreement TEXT,
            alternative_role TEXT,
            feedback_reason TEXT,
            comments TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Check if prediction_id column exists (for migration)
    cursor.execute("PRAGMA table_info(feedback)")
    f_columns = [info[1] for info in cursor.fetchall()]
    if 'prediction_id' not in f_columns:
         print("Migrating DB: Adding 'prediction_id' column to feedback table...")
         try:
             cursor.execute("ALTER TABLE feedback ADD COLUMN prediction_id INTEGER")
         except sqlite3.OperationalError as e:
             print(f"Migration warning: {e}")

    if 'status' not in f_columns:
        print("Migrating DB: Adding 'status' column to feedback table...")
        try:
             cursor.execute("ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT 'Pending'")
        except sqlite3.OperationalError as e:
             print(f"Migration warning: {e}")

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

def load_artifacts():
    """Load ML artifacts from the model directory."""
    global model, encoders
    try:
        print("Loading ML artifacts...")
        model_path = os.path.join(MODEL_DIR, 'job_model.pkl')
        if os.path.exists(model_path):
            model = joblib.load(model_path)
        else:
            print(f"Warning: {model_path} not found.")

        # Map internal feature names to filenames
        # Map internal feature names to filenames
        # We need to match what train_model.py saves
        mappings = {
            'degree': 'degree_encoder.pkl',
            'specialization': 'spec_encoder.pkl',
            'job_role': 'job_encoder.pkl',
            'internship_experience': 'internship_experience_encoder.pkl',
            'certifications': 'certifications_encoder.pkl'
        }

        for feature, filename in mappings.items():
            path = os.path.join(MODEL_DIR, filename)
            if os.path.exists(path):
                encoders[feature] = joblib.load(path)
            else:
                print(f"Warning: {path} not found.")
        
        print("ML artifacts loaded.")
    except Exception as e:
        print(f"Error loading artifacts: {e}")

# --- Admin Endpoints ---

@app.route('/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT * FROM admin_users WHERE username = ? AND password = ?", (username, password))
        user = cur.fetchone()
        conn.close()
        
        if user:
            return jsonify({'message': 'Login successful', 'token': 'dummy_admin_token', 'role': 'admin'}), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/admin/stats', methods=['GET'])
def admin_stats():
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        # Total Predictions
        cur.execute("SELECT COUNT(*) FROM history")
        total_predictions = cur.fetchone()[0]
        
        # Flagged Predictions
        cur.execute("SELECT COUNT(*) FROM history WHERE flagged = 1")
        total_flagged = cur.fetchone()[0]
        
        # Unique Users (approximate based on user_id)
        cur.execute("SELECT COUNT(DISTINCT user_id) FROM history")
        total_users = cur.fetchone()[0]
        
        # Role Distribution
        cur.execute("SELECT role, COUNT(*) as count FROM history GROUP BY role ORDER BY count DESC LIMIT 5")
        role_dist = [{'role': row[0], 'count': row[1]} for row in cur.fetchall()]
        
        conn.close()
        
        # Model Info (Last Modified of model file)
        model_path = os.path.join(MODEL_DIR, 'job_model.pkl')
        last_trained = "Unknown"
        if os.path.exists(model_path):
            timestamp = os.path.getmtime(model_path)
            last_trained = datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({
            'total_predictions': total_predictions,
            'total_flagged': total_flagged,
            'total_users': total_users,
            'role_distribution': role_dist,
            'last_trained': last_trained
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/predictions', methods=['GET'])
def admin_predictions():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # enhanced query to get feedback rating
        # Now joining strictly on ID
        query = '''
            SELECT h.id, h.user_id, h.role, h.confidence, h.timestamp, h.flagged, h.degree, h.specialization, f.relevance_rating as rating
            FROM history h
            LEFT JOIN feedback f ON h.id = f.prediction_id
            ORDER BY h.timestamp DESC 
            LIMIT 500
        '''
        
        cur.execute(query)
        rows = cur.fetchall()
        conn.close()
        
        logs = [dict(row) for row in rows]
        return jsonify(logs)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/flag', methods=['POST'])
def admin_flag():
    try:
        data = request.get_json()
        log_id = data.get('id')
        new_status = data.get('flagged', 0)
        
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("UPDATE history SET flagged = ? WHERE id = ?", (new_status, log_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Updated flag status'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def run_retraining_script():
    """Executes the training script in a separate thread/process."""
    try:
        print("Starting model retraining...")
        # Ensure we are calling the python env correctly. 
        # Using 'python' assumes it's in path.
        subprocess.run(['python', TRAINING_SCRIPT_PATH], check=True)
        print("Model retraining complete. Reloading artifacts...")
        load_artifacts() # Reload in memory
    except Exception as e:
        print(f"Retraining failed: {e}")

@app.route('/admin/retrain', methods=['POST'])
def admin_retrain():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file:
            # Save the new dataset
            # We backup the old one first? (Skipping for simplicity as per requirement "The old model is replaced")
            file.save(DATASET_PATH)
            
            # Trigger training in background
            thread = threading.Thread(target=run_retraining_script)
            thread.start()
            
            return jsonify({'message': 'Dataset uploaded. Training started in background.'}), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/all_feedback', methods=['GET'])
def admin_all_feedback():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # Join with history to get confidence and original role if needed, though feedback has snapshot
        # We'll just fetch from feedback table and maybe join history for extra context if needed
        query = '''
            SELECT f.*, h.confidence 
            FROM feedback f
            LEFT JOIN history h ON f.prediction_id = h.id
            ORDER BY f.timestamp DESC
        '''
        
        cur.execute(query)
        rows = cur.fetchall()
        conn.close()
        
        feedback_list = [dict(row) for row in rows]
        # Parse JSON fields if any (feedback_reason is stored as JSON string)
        for item in feedback_list:
            if item.get('feedback_reason'):
                try:
                    item['feedback_reason'] = json.loads(item['feedback_reason'])
                except:
                    pass
        
        return jsonify(feedback_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/feedback/status', methods=['POST'])
def admin_feedback_status():
    try:
        data = request.get_json()
        feedback_id = data.get('id')
        new_status = data.get('status')
        
        if not feedback_id or not new_status:
             return jsonify({'error': 'Missing id or status'}), 400

        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("UPDATE feedback SET status = ? WHERE id = ?", (new_status, feedback_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Status updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- End Admin Endpoints ---

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        # Features expected by model
        degree = data.get('degree', 'B.Tech')
        specialization = data.get('specialization', 'Computer Science')
        
        # Normalize "Artificial Intelligence & Data Science" to "Artificial Intelligence"
        if specialization and "Artificial Intelligence" in specialization and "Data Science" in specialization:
             specialization = "Artificial Intelligence"
        
        skills_list = data.get('skills', [])
        
        # New Feature: CGPA (default to average 7.5 if missing)
        try:
            cgpa = float(data.get('cgpa', 7.5))
        except (ValueError, TypeError):
            cgpa = 7.5
            
        # Project Count (default 0)
        try:
            project_count = int(data.get('project_count', 0))
        except (ValueError, TypeError):
            project_count = 0

        internship = "No"
        placements = data.get('placementStatus', [])
        internships_list = data.get('internships', [])
        
        # Smart Logic: Internship Experience = Yes if user has ANY placement OR ANY internship record
        if len(placements) > 0 or len(internships_list) > 0:
            internship = "Yes"
            
        certs = data.get('certifications', [])
        has_certs = "Yes" if len(certs) > 0 else "No"
        
        # Prepare DataFrame
        features = pd.DataFrame([{
            'degree': degree,
            'specialization': specialization,
            'cgpa': cgpa,
            'internship_experience': internship,
            'certifications': has_certs,
            'project_count': project_count
        }])
        
        # Encode
        # Numerical columns that don't need encoding
        numerical_cols = ['cgpa', 'project_count']
        
        for col in features.columns:
            if col in encoders:
                try:
                    features[col] = encoders[col].transform(features[col])
                except ValueError:
                    # Handle unseen labels by assigning a default (e.g., 0)
                    # Ideally we'd use a special 'unknown' token if trained with one
                    features[col] = 0
            elif col not in numerical_cols:
                 # If it's categorical but no encoder found (shouldn't happen if loaded), 
                 # maybe warn or skip?
                 pass
        
        # Predict
        if model:
            # Get probability for confidence
            probs = model.predict_proba(features)[0]
            
            # Map indices to class names
            class_names = encoders['job_role'].classes_
            
            # Create list of {role, score}
            role_probs = []
            for i, score in enumerate(probs):
                role_probs.append({'role': class_names[i], 'score': float(score)})
            
            # Sort by score descending
            role_probs.sort(key=lambda x: x['score'], reverse=True)
            
            # Top result (Initial)
            top_role = role_probs[0]['role']
            confidence = role_probs[0]['score']

            # --- Post-Prediction Adjustment Logic ---
            adjustment_msg = ""
            
            # Rule: If predicted role = ML Engineer BUT user's job title/skills indicate Data Scientist
            # -> downgrade confidence and reorder
            
            # Check for Data Scientist signals
            ds_signals = False
            
            # 1. Check Skills
            ds_keywords = {'data scientist', 'data science', 'statistics', 'r', 'pandas', 'matplotlib'}
            user_skills_norm = {s.lower().strip() for s in skills_list}
            if not user_skills_norm.isdisjoint(ds_keywords):
                ds_signals = True
                
            # 2. Check Specialization
            if 'data science' in specialization.lower():
                ds_signals = True
                
            # 3. Check Placement Status (Job Titles)
            for p in placements:
                title = p.get('role', '').lower()
                if 'data scientist' in title or 'data analyst' in title:
                    ds_signals = True
                    break

            # Apply Adjustment
            if False: # Heuristics disabled: top_role == 'ML Engineer' and ds_signals:
                print(f"Adjusting predictions: Downgrading ML Engineer due to DS signals.")
                role_dict = {item['role']: item for item in role_probs}
                
                # Penalize ML Engineer
                if 'ML Engineer' in role_dict:
                    role_dict['ML Engineer']['score'] *= 0.4
                    
                # Boost Data Scientist
                if 'Data Scientist' in role_dict:
                     # Ensure it has some base score if it was 0, or boost it
                     current_score = role_dict['Data Scientist']['score']
                     new_score = max(current_score * 3.0, 0.6) 
                     role_dict['Data Scientist']['score'] = new_score
                
                # Re-sort
                role_probs.sort(key=lambda x: x['score'], reverse=True)
                
                # Update top result
                top_role = role_probs[0]['role']
                confidence = role_probs[0]['score']
                
                adjustment_msg = " (Adjusted based on specific Data Scientist skills/experience detected in your profile.)"
            # ----------------------------------------
            
            # Generate Insights (Simple Rule-based)
            insights = []
            
            # 1. Missing Skills Analysis
            missing_skills = calculate_missing_skills(skills_list, top_role)
            if missing_skills:
                # Add specific recommendations to insights
                # We limit to top 3 to avoid overwhelming
                for skill in missing_skills[:3]:
                    insights.append(f"Skill Gap: Learning '{skill}' is highly recommended for {top_role} roles.")
                if len(missing_skills) > 3:
                     insights.append(f"And {len(missing_skills) - 3} other skills: {', '.join(missing_skills[3:])}")
            else:
                 insights.append(f"Great job! You have all the core skills we check for {top_role}.")

            # 2. Other heuristics
            if cgpa < 7.0:
                 insights.append("Academic Performance: Consistent academic performance (CGPA > 7.0) is often valued by recruiters.")
            if has_certs == "No":
                insights.append("Certifications: Adding industry-recognized certifications can significantly boost your profile.")
            if internship == "No":
                 insights.append("Experience: Look for internship opportunities to gain practical experience.")
            
            if not insights:
                insights.append("Your profile looks strong! Focus on building a unique portfolio.")

            # Explanation
            explanation = f"Our AI analyzed your {degree} in {specialization} and academic profile (CGPA {cgpa}). Your profile matches patterns found in successful {top_role}s."
            explanation += adjustment_msg
            
            # Save to DB (only top result)
            prediction_id = None
            if user_id:
                try:
                    conn = sqlite3.connect(DB_PATH)
                    cur = conn.cursor()
                    cur.execute(
                        "INSERT INTO history (user_id, role, confidence, explanation, flagged, degree, specialization) VALUES (?, ?, ?, ?, 0, ?, ?)",
                        (user_id, top_role, confidence, explanation, degree, specialization)
                    )
                    prediction_id = cur.lastrowid
                    conn.commit()
                    conn.close()
                except Exception as db_err:
                    print(f"DB Error: {db_err}")
            
            return jsonify({
                'prediction_id': prediction_id,
                'role': top_role,
                'confidence': f"{confidence*100:.1f}%",
                'explanation': explanation,
                'probabilities': role_probs, # Return full distribution
                'insights': insights,
                'missing_skills': missing_skills
            })
            
        else:
             return jsonify({'error': 'Model not loaded'}), 500

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        
        user_id = data.get('user_id')
        prediction_id = data.get('prediction_id')
        predicted_role = data.get('predicted_role')
        relevance_rating = data.get('relevance_rating')
        confidence_agreement = data.get('confidence_agreement')
        alternative_role = data.get('alternative_role')
        feedback_reason = json.dumps(data.get('feedback_reason')) if data.get('feedback_reason') else None
        comments = data.get('comments')
        
        # Validation
        if not predicted_role or not relevance_rating:
            return jsonify({'error': 'Missing mandatory fields'}), 400

        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO feedback (
                user_id, prediction_id, predicted_role, relevance_rating, confidence_agreement, 
                alternative_role, feedback_reason, comments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, prediction_id, predicted_role, relevance_rating, confidence_agreement, alternative_role, feedback_reason, comments))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Feedback submitted successfully'}), 200
    except Exception as e:
        print(f"Feedback error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/history/<user_id>', methods=['GET'])
def get_history(user_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM history WHERE user_id = ? ORDER BY timestamp DESC", (user_id,))
        rows = cur.fetchall()
        conn.close()
        
        history = [dict(row) for row in rows]
        return jsonify(history)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Authentication Routes ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return jsonify({'success': False, 'message': 'Please provide all required fields'}), 400

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_id = str(int(time.time() * 1000))
        created_at = datetime.datetime.now()
        
        # Insert New User
        cursor.execute('''
            INSERT INTO users (id, name, email, password, createdAt, educations, certifications, skills, placementStatus) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, name, email, hashed_password, created_at, 
            json.dumps([]), json.dumps([]), json.dumps([]), json.dumps([])
        ))
        
        conn.commit()
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

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()

        if not user:
             return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        # Check password
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
    print("--- Google Login Request Received ---")
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
             return jsonify({'success': False, 'message': 'Token is required'}), 400
             
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        name = idinfo.get('name')
        sub = idinfo['sub'] # Google ID
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            # Create new user
            user_id = str(int(time.time() * 1000))
            created_at = datetime.datetime.now()
            
            # Insert
            cursor.execute('''
                INSERT INTO users (id, name, email, password, googleId, createdAt, educations, certifications, skills, placementStatus) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id, name, email, '', sub, created_at,
                json.dumps([]), json.dumps([]), json.dumps([]), json.dumps([])
            ))
            conn.commit()
            
            # Fetch back
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
        else:
            # Update googleId if missing
            if not user['googleId']:
                cursor.execute("UPDATE users SET googleId = ? WHERE id = ?", (sub, user['id']))
                conn.commit()
                # Fetch updated
                cursor.execute("SELECT * FROM users WHERE id = ?", (user['id'],))
                user = cursor.fetchone()

        conn.close()
        
        token = generate_token(user['id'], user['email'])
        user_data = process_user_for_response(user)
        
        return jsonify({
            'success': True,
            'message': 'Google login successful',
            'data': user_data,
            'token': token
        })

    except ValueError as ve:
         print(f"Google token verification failed (ValueError): {ve}")
         return jsonify({'success': False, 'message': f'Invalid token: {str(ve)}'}), 401
    except Exception as e:
        print(f"Google login FULL error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Google Auth Error: {str(e)}'}), 401
        return jsonify({'success': False, 'message': 'Google authentication failed'}), 401

@app.route('/api/user/<string:id>', methods=['GET'])
def get_user(id):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (id,))
        user = cursor.fetchone()
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
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (id,))
        user = cursor.fetchone()
        
        if not user:
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
            query_parts.append("name = ?")
            params.append(name)
        if email:
            query_parts.append("email = ?")
            params.append(email)
        if educations is not None:
            # Encryption skipped for simpliciy during migration
            query_parts.append("educations = ?")
            params.append(json.dumps(educations))
        if certifications is not None:
            query_parts.append("certifications = ?")
            params.append(json.dumps(certifications))
        if skills is not None:
             query_parts.append("skills = ?")
             params.append(json.dumps(skills))
        if placement_status is not None:
             query_parts.append("placementStatus = ?")
             params.append(json.dumps(placement_status))
        if new_password:
             hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
             query_parts.append("password = ?")
             params.append(hashed)
             
        if query_parts:
            sql = f"UPDATE users SET {', '.join(query_parts)} WHERE id = ?"
            params.append(id)
            cursor.execute(sql, tuple(params))
            conn.commit()
            
        # Fetch updated user
        cursor.execute("SELECT * FROM users WHERE id = ?", (id,))
        updated_user = cursor.fetchone()
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
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ?", (id,))
        rows_affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        if rows_affected == 0:
             return jsonify({'success': False, 'message': 'User not found'}), 404
             
        return jsonify({'success': True, 'message': 'Account deleted successfully'})

    except Exception as e:
        print(f"Delete user error: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete account'}), 500

if __name__ == '__main__':
    init_db()
    load_artifacts()
    app.run(port=PORT, debug=True)
