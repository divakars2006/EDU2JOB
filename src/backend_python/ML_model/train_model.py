import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import os

# Configuration
# Assuming script is run from project root
DATASET_PATH = 'src/backend_python/ML_model/job_roles_dataset.tsv'
MODEL_DIR = 'src/model'

def train_model():
    print("Loading dataset...")
    try:
        df = pd.read_csv(DATASET_PATH, sep='\t')
    except FileNotFoundError:
        print(f"Error: Dataset not found at {DATASET_PATH}")
        # Try finding it if run from src/
        if os.path.exists('../' + DATASET_PATH):
             df = pd.read_csv('../' + DATASET_PATH, sep='\t')
        else:
             return

    # Ensure model directory exists
    os.makedirs(MODEL_DIR, exist_ok=True)

    # Features to encode
    # User specifically requested degree_encoder.pkl and spec_encoder.pkl
    # We will keep other features but follow naming convention where possible
    
    # Feature mappings
    # degree -> degree_encoder.pkl
    # specialization -> spec_encoder.pkl
    # job_role -> job_encoder.pkl
    
    encoders = {}
    
    # Standardize column naming just in case
    # Taking all categorical columns used in previous model
    feature_cols = [
        'degree', 
        'specialization', 
        'cgpa',
        'internship_experience',
        'certifications',
        'project_count'
    ]
    
    target_col = 'job_role'

    print("Encoding features...")
    for col in feature_cols:
        # Skip numerical columns
        if col in ['cgpa', 'project_count']:
            continue

        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
        
        # Determine filename
        if col == 'degree':
            filename = 'degree_encoder.pkl'
        elif col == 'specialization':
            filename = 'spec_encoder.pkl'
        else:
            filename = f'{col}_encoder.pkl'
            
        joblib.dump(le, os.path.join(MODEL_DIR, filename))
        print(f"Saved {filename}")

    # Encode Target
    le_target = LabelEncoder()
    df[target_col] = le_target.fit_transform(df[target_col])
    
    # Save target encoder as job_encoder.pkl
    joblib.dump(le_target, os.path.join(MODEL_DIR, 'job_encoder.pkl'))
    print("Saved job_encoder.pkl")

    # Train Model
    X = df[feature_cols] # Ensure order
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")

    # Save Model as job_model.pkl
    joblib.dump(clf, os.path.join(MODEL_DIR, 'job_model.pkl'))
    print(f"Saved job_model.pkl to {MODEL_DIR}")

if __name__ == '__main__':
    train_model()
