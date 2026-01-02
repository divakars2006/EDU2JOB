import os
import sqlite3
import json
import datetime
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')
PORT = 5000

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

def init_db():
    """Initialize the SQLite database for prediction history."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            confidence REAL,
            explanation TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
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
            'job_role': 'job_encoder.pkl'
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

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        # Features expected by model
        degree = data.get('degree', 'B.Tech')
        specialization = data.get('specialization', 'Computer Science')
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
        if any(p.get('type') == 'Internship' for p in placements):
            internship = "Yes"
            
        certs = data.get('certifications', [])
        has_certs = "Yes" if len(certs) > 0 else "No"
        
        # Prepare DataFrame
        # Prepare DataFrame
        # Prepare DataFrame
        features = pd.DataFrame([{
            'degree': degree,
            'specialization': specialization,
            'cgpa': cgpa
        }])
        
        # Encode
        for col, encoder in encoders.items():
            if col in features.columns and col != 'cgpa':
                try:
                    features[col] = encoder.transform(features[col])
                except ValueError:
                    features[col] = 0
        
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
            if top_role == 'ML Engineer' and ds_signals:
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
            if user_id:
                try:
                    conn = sqlite3.connect(DB_PATH)
                    cur = conn.cursor()
                    cur.execute(
                        "INSERT INTO history (user_id, role, confidence, explanation) VALUES (?, ?, ?, ?)",
                        (user_id, top_role, confidence, explanation)
                    )
                    conn.commit()
                    conn.close()
                except Exception as db_err:
                    print(f"DB Error: {db_err}")
            
            return jsonify({
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

if __name__ == '__main__':
    init_db()
    load_artifacts()
    app.run(port=PORT, debug=True)
