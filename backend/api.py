import os
import json
import datetime
import joblib
import pandas as pd
import numpy as np
import subprocess
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import threading
# Auth Imports
import bcrypt
import jwt
import time
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from db import get_db_connection
import psycopg2
from psycopg2.extras import RealDictCursor

# Production Static Serving Setup
# Requires 'npm run build' in frontend to populate dist
frontend_dist = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
app = Flask(__name__, static_folder=frontend_dist, static_url_path='')
CORS(app)

# Initialize DB
def init_db():
    """Initialize PostgreSQL tables if they don't exist."""
    print("Initializing Database...")
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Admin Users
        cur.execute("""
            CREATE TABLE IF NOT EXISTS admin_users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT
            );
        """)
        
        # Normal Users 
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, 
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                createdAt TIMESTAMP,
                educations JSONB,
                certifications JSONB,
                skills JSONB,
                placementStatus JSONB
            );
        """)
        
        # History
        cur.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                role TEXT,
                confidence FLOAT,
                explanation TEXT,
                flagged INTEGER DEFAULT 0,
                degree TEXT,
                specialization TEXT,
                flag_status TEXT,
                flag_reason TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Feedback
        cur.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                prediction_id INTEGER,
                predicted_role TEXT,
                relevance_rating INTEGER,
                confidence_agreement TEXT,
                alternative_role TEXT,
                feedback_reason JSONB,
                comments TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT
            );
        """)
        
        # Create default admin if not exists
        cur.execute("SELECT * FROM admin_users WHERE username = %s", ('admin',))
        if not cur.fetchone():
            cur.execute("INSERT INTO admin_users (username, password, email) VALUES (%s, %s, %s)", ('admin', 'admin123', 'admin@info.com'))
            print("Default admin created.")

        conn.commit()
        conn.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"DB Init Error: {e}")

# Run init
with app.app_context():
    init_db()

@app.route("/api/health", methods=["GET"])
def health():
    return {
        "status": "ok",
        "message": "Backend is running"
    }, 200

# Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
# DB_PATH removed as we use get_db_connection
DATASET_PATH = os.path.join(os.path.dirname(__file__), 'backend_python', 'ML_model', 'job_roles_dataset.tsv')
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
    'Business Analyst': ['SQL', 'Excel', 'Tableau', 'Power BI', 'Python', 'Data Analysis'],
    'Data Analyst': ['SQL', 'Python', 'Excel', 'Data Visualization', 'Tableau', 'Power BI', 'Statistics']
}

def calculate_missing_skills(user_skills, role):
    """
    Calculate missing skills for a given role based on user's current skills.
    Returns a set of missing skills.
    """
    required_skills = ROLE_SKILLS_MAP.get(role)
    
    # Robust lookup if direct key fails
    if not required_skills:
        for k, v in ROLE_SKILLS_MAP.items():
            if k.lower() == role.lower().strip():
                required_skills = v
                break

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
    user_dict = dict(user) if hasattr(user, 'copy') or isinstance(user, ConfigProto) else dict(user)
    # Actually RealDictRow behaves like dict, so we can just use .copy() or dict()
    user_dict = dict(user)
    
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

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        print(f"DEBUG: Admin Login Attempt: '{username}' with pass '{password}'")

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Debug: Check if user exists at all
        cur.execute("SELECT * FROM admin_users WHERE username = %s", (username,))
        found = cur.fetchone()
        if found:
             print(f"DEBUG: User found: {found}")
        else:
             print(f"DEBUG: User '{username}' NOT found in DB")

        cur.execute("SELECT * FROM admin_users WHERE username = %s AND password = %s", (username, password))
        user = cur.fetchone()
        conn.close()
        
        if user:
            print("DEBUG: Login SUCCESS")
            return jsonify({'message': 'Login successful', 'token': 'dummy_admin_token', 'role': 'admin'}), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    try:
        conn = get_db_connection()
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
        
        # Model Info (Read from metadata json)
        metadata_path = os.path.join(MODEL_DIR, 'model_metadata.json')
        model_metadata = {}
        
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    model_metadata = json.load(f)
            except:
                pass
                
        # Default values if metadata missing
        last_trained = model_metadata.get('last_trained', 'Unknown')
        accuracy = model_metadata.get('accuracy', 'N/A')
        dataset_size = model_metadata.get('dataset_size', 'N/A')
        training_status = model_metadata.get('status', 'Unknown')
        
        # Determine overall model status
        model_status = 'Active' if model is not None else 'Inactive'

        return jsonify({
            'total_predictions': total_predictions,
            'total_flagged': total_flagged,
            'total_users': total_users,
            'role_distribution': role_dist,
            'last_trained': last_trained,
            'accuracy': accuracy,
            'dataset_size': dataset_size,
            'training_status': training_status,
            'model_status': model_status
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/predictions', methods=['GET'])
def admin_predictions():
    try:
        conn = get_db_connection()
        # conn.row_factory = sqlite3.Row # Not needed for psycopg2 RealDictCursor
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # enhanced query to get feedback rating
        # Now joining strictly on ID
        # enhanced query to include flag details and feedback
        query = '''
            SELECT h.id, h.user_id, h.role, h.confidence, h.timestamp, h.flagged, h.degree, h.specialization, 
                   h.flag_status, h.flag_reason,
                   f.relevance_rating as rating, f.feedback_reason, f.comments
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

@app.route('/api/admin/flag', methods=['POST'])
def admin_flag():
    try:
        data = request.get_json()
        log_id = data.get('id')
        new_flag_val = data.get('flagged')
        new_status = data.get('status')
        new_reason = data.get('reason')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        updates = []
        params = []
        
        if new_flag_val is not None:
            updates.append("flagged = %s")
            params.append(new_flag_val)
        
        if new_status:
            updates.append("flag_status = %s")
            params.append(new_status)
            
        if new_reason:
            updates.append("flag_reason = %s")
            params.append(new_reason)
            
        if updates:
            sql = f"UPDATE history SET {', '.join(updates)} WHERE id = %s"
            params.append(log_id)
            cur.execute(sql, tuple(params))
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

@app.route('/api/admin/retrain', methods=['POST'])
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

@app.route('/api/admin/all_feedback', methods=['GET'])
def admin_all_feedback():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Join with history to get confidence and original role if needed, though feedback has snapshot
        # We'll just fetch from feedback table and maybe join history for extra context if needed
        query = '''
            SELECT f.*, h.confidence, h.flagged
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
                    if isinstance(item['feedback_reason'], str):
                         item['feedback_reason'] = json.loads(item['feedback_reason'])
                except:
                    pass
        
        return jsonify(feedback_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/feedback/status', methods=['POST'])
def admin_feedback_status():
    try:
        data = request.get_json()
        feedback_id = data.get('id')
        new_status = data.get('status')
        
        if not feedback_id or not new_status:
             return jsonify({'error': 'Missing id or status'}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE feedback SET status = %s WHERE id = %s", (new_status, feedback_id))
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
        
        print(f"--- Prediction Request ({user_id}) ---")
        print(f"Raw Input: {json.dumps(data, indent=2)}")

        # Features expected by model
        raw_degree = data.get('degree', 'B.Tech').strip()
        raw_spec = data.get('specialization', 'Computer Science').strip()
        
        # --- Normalization Logic ---
        # Map user input to dataset labels: 
        # Degrees: B.Tech, M.Sc, MCA, MBA
        # Specs: Computer Science, Information Technology, Data Science, Artificial Intelligence, Business Analytics, Artificial Intelligence & Data Science
        
        degree_map = {
            'btech': 'B.Tech', 'b.tech': 'B.Tech', 'b.e': 'B.Tech', 'bachelor of technology': 'B.Tech',
            'msc': 'M.Sc', 'm.sc': 'M.Sc', 'master of science': 'M.Sc',
            'mca': 'MCA', 'master of computer applications': 'MCA',
            'mba': 'MBA', 'master of business administration': 'MBA'
        }
        
        spec_map = {
            'cse': 'Computer Science', 'cs': 'Computer Science', 'computer science': 'Computer Science', 'computer science engineering': 'Computer Science',
            'it': 'Information Technology', 'information technology': 'Information Technology',
            'ds': 'Data Science', 'data science': 'Data Science',
            'ai': 'Artificial Intelligence', 'aiml': 'Artificial Intelligence', 'artificial intelligence': 'Artificial Intelligence',
            'ba': 'Business Analytics', 'business analytics': 'Business Analytics',
            'ai & ds': 'Artificial Intelligence & Data Science', 'artificial intelligence & data science': 'Artificial Intelligence & Data Science',
            'aids': 'Artificial Intelligence & Data Science'
        }
        
        # Normalize Degree
        degree = 'B.Tech' # Default
        clean_degree = raw_degree.lower().replace('.', '').replace(' ', '')
        if clean_degree in degree_map:
             degree = degree_map[clean_degree]
        elif raw_degree in degree_map.values(): # Already valid
             degree = raw_degree

        # Normalize Specialization
        specialization = 'Computer Science' # Default
        clean_spec = raw_spec.lower()
        
        # Iterative match for specialization because it has spaces
        found_spec = False
        
        # Check direct map first
        if clean_spec in spec_map:
            specialization = spec_map[clean_spec]
            found_spec = True
        
        if not found_spec:
            for key, val in spec_map.items():
                if len(key) > 3 and key in clean_spec: # Avoid matching 'it' in 'algorithms'
                    specialization = val
                    found_spec = True
                    break
        
        if not found_spec:
             # Handle "Artificial Intelligence & Data Science" normalization from earlier code
             if "artificial intelligence" in clean_spec and "data science" in clean_spec:
                 specialization = "Artificial Intelligence & Data Science"
             elif "artificial intelligence" in clean_spec:
                 specialization = "Artificial Intelligence"
             elif "data science" in clean_spec:
                 specialization = "Data Science"
             elif raw_spec in spec_map.values():
                 specialization = raw_spec
        
        print(f"Normalized Inputs -> Degree: {degree}, Spec: {specialization}")

        skills_list = data.get('skills', [])
        # Ensure skills_list is list of strings
        if isinstance(skills_list, str):
            try:
                skills_list = json.loads(skills_list)
            except:
                skills_list = [skills_list]
        
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
        
        # Calculate Programming Skill Level
        # Heuristic: Count valid skills
        skill_count = len(skills_list)
        if skill_count >= 5:
            prog_skill = "Advanced"
        elif skill_count >= 3:
            prog_skill = "Intermediate"
        else:
            prog_skill = "Beginner"

        # Prepare DataFrame
        features = pd.DataFrame([{
            'degree': degree,
            'specialization': specialization,
            'internship_experience': internship,
            'certifications': has_certs,
            'project_count': project_count
        }])
        
        print(f"Features for Model:\n{features}")

        # Encode
        # Numerical columns that don't need encoding
        numerical_cols = ['cgpa', 'project_count']
        
        for col in features.columns:
            if col in encoders:
                try:
                    features[col] = encoders[col].transform(features[col])
                except ValueError:
                    print(f"Warning: Unseen label for {col}: {features[col].iloc[0]}. Defaulting to 0.")
                    # Handle unseen labels by assigning a default (e.g., 0)
                    features[col] = 0
            elif col not in numerical_cols:
                 pass
        
        print(f"Encoded Features (Vector) for Model:\n{features}")
        
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

            print(f"Raw Prediction: {top_role} ({confidence})")

            # --- Post-Prediction Adjustment Logic ---
            adjustment_msg = ""
            
            # Generate Insights (Simple Rule-based)
            insights = []
            
            # 1. Missing Skills Analysis
            # Recalculate correctly
            missing_skills = []
            normalized_user_skills = set()
            for s in skills_list:
                if isinstance(s, str):
                    normalized_user_skills.add(s.lower().strip())
                elif isinstance(s, dict) and 'name' in s: # Handle obj if applicable
                     normalized_user_skills.add(s['name'].lower().strip())

            print(f"User Skills (Norm): {normalized_user_skills}")

            required = ROLE_SKILLS_MAP.get(top_role, [])
            for req_skill in required:
                if req_skill.lower().strip() not in normalized_user_skills:
                    missing_skills.append(req_skill)
            
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
                    conn = get_db_connection()
                    cur = conn.cursor()
                    cur.execute(
                        "INSERT INTO history (user_id, role, confidence, explanation, flagged, degree, specialization) VALUES (%s, %s, %s, %s, 0, %s, %s) RETURNING id",
                        (user_id, top_role, confidence, explanation, degree, specialization)
                    )
                    prediction_id = cur.fetchone()[0]
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

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO feedback (
                user_id, prediction_id, predicted_role, relevance_rating, confidence_agreement, 
                alternative_role, feedback_reason, comments
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
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
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM history WHERE user_id = %s ORDER BY timestamp DESC", (user_id,))
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

        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_id = str(int(time.time() * 1000))
        created_at = datetime.datetime.now()
        
        # Insert New User
        cursor.execute('''
            INSERT INTO users (id, name, email, password, createdAt, educations, certifications, skills, placementStatus) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
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

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cur = conn.cursor()

    # 1. Check normal users (bcrypt)
    cur.execute("SELECT id, password FROM users WHERE email=%s", (email,))
    user = cur.fetchone()

    if user:
        # Check if user is dict (RealDictCursor) or tuple
        # Step 258 said RealDictCursor was used in app.py, but get_db_connection in db.py just returns raw connection?
        # db.py: return psycopg2.connect(...)
        # api.py code I'm pasting implies tuple unpacking: user_id, hashed_password = user
        # IF RealDictCursor is used, this unpacking will FAIL.
        # Let's check db.py again. It does NOT set cursor_factory.
        # So it returns standard tuples.
        # User's provided code: user_id, hashed_password = user
        # IF SELECT id, password ... returns (id, password), this works.
        
        user_id, hashed_password = user
        if bcrypt.checkpw(password.encode(), hashed_password.encode()):
            return jsonify({
                "success": True,
                "isAdmin": False
            })

    # 2. Check admin users (PLAINTEXT)
    cur.execute("SELECT id, password FROM admin_users WHERE email=%s", (email,))
    admin = cur.fetchone()

    if admin:
        admin_id, admin_password = admin
        if password == admin_password:
            return jsonify({
                "success": True,
                "isAdmin": True
            })

    return jsonify({
        "success": False,
        "message": "Invalid email or password"
    }), 401


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



# --- Catch-All Route for Helper Files & Frontend ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        # Fallback to index.html for React Router
        if os.path.exists(os.path.join(app.static_folder, 'index.html')):
             return send_from_directory(app.static_folder, 'index.html')
        else:
            return "Frontend not built. Run 'npm run build' in frontend directory.", 404

if __name__ == '__main__':
    # Initialize DB on start

    load_artifacts()
    print(f"Server starting on http://localhost:{PORT}")
    app.run(debug=True, port=PORT, host='0.0.0.0')
