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
        print(f"Dataset loaded. Shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
    except FileNotFoundError:
        print(f"Error: Dataset not found at {DATASET_PATH}")
        # Try finding it if run from src/
        if os.path.exists('../' + DATASET_PATH):
             df = pd.read_csv('../' + DATASET_PATH, sep='\t')
             print(f"Dataset loaded from parent. Shape: {df.shape}")
        else:
             print("Dataset absolutely not found.")
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
        'programming_skill_level',
        'internship_experience',
        'certifications',
        'project_count'
    ]
    
    target_col = 'job_role'
    
    # Check if target column exists
    if target_col not in df.columns:
        print(f"Error: Target column '{target_col}' not found.")
        raise ValueError(f"Target column '{target_col}' not found.")

    # Filter feature_cols to only those present in df
    available_features = [c for c in feature_cols if c in df.columns]
    missing_features = set(feature_cols) - set(available_features)
    if missing_features:
        print(f"Warning: The following features are missing from dataset and will be ignored: {missing_features}")
    
    feature_cols = available_features

    print("Encoding features...")
    for col in feature_cols:
        # Skip numerical columns
        if col in ['project_count']:
            continue
            
        le = LabelEncoder()
        # Ensure strings
        df[col] = df[col].astype(str)
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
    
    # Check if we have features left
    if not feature_cols:
        raise ValueError("No feature columns found in dataset!")

    # Train Model
    X = df[feature_cols] # Ensure order
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy * 100:.2f}%")

    # Save Model as job_model.pkl
    joblib.dump(clf, os.path.join(MODEL_DIR, 'job_model.pkl'))
    print(f"Saved job_model.pkl to {MODEL_DIR}")
    
    # Save Metadata
    import json
    import datetime
    
    metadata = {
        'dataset_size': len(df),
        'accuracy': f"{accuracy * 100:.2f}%",
        'last_trained': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'status': 'Success'
    }
    
    with open(os.path.join(MODEL_DIR, 'model_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=4)
    print("Saved model_metadata.json")

if __name__ == '__main__':
    try:
        train_model()
    except Exception as e:
        print(f"Training failed: {e}")
        # Try to save failure status
        try:
           import json
           import datetime
           MODEL_DIR = 'src/model' # Re-define locally just in case
           if not os.path.exists(MODEL_DIR):
               os.makedirs(MODEL_DIR, exist_ok=True)
               
           metadata = {
               'dataset_size': 0,
               'accuracy': '0%',
               'last_trained': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
               'status': 'Failed'
           }
           with open(os.path.join(MODEL_DIR, 'model_metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=4)
        except:
            pass
