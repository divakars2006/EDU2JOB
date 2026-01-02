import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, MinMaxScaler, MultiLabelBinarizer
from sklearn.impute import SimpleImputer
import json

class DataPreprocessor:
    def __init__(self):
        self.scaler = MinMaxScaler()
        self.degree_encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.spec_encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.skills_mlb = MultiLabelBinarizer()
        
    def load_data(self, data_list):
        """
        Load data from a list of dictionaries (simulating DB response).
        """
        df = pd.DataFrame(data_list)
        return df

    def clean_educational_data(self, df):
        """
        Clean educational fields and handle missing values.
        """
        print("Cleaning data...")
        # handling missing numerical values with mean
        if 'cgpa' in df.columns:
            df['cgpa'] = df['cgpa'].fillna(df['cgpa'].mean())
        
        # handling missing categorical values with mode or placeholder
        if 'degree' in df.columns:
            df['degree'] = df['degree'].fillna(df['degree'].mode()[0])
        
        if 'specialization' in df.columns:
            df['specialization'] = df['specialization'].fillna('Unknown')

        # Drop rows where critical info is missing if needed
        # df.dropna(subset=['id'], inplace=True)
        
        return df

    def encode_categorical_fields(self, df):
        """
        Encode Degree, Specialization, and Skills.
        """
        print("Encoding categorical fields...")
        
        # 1. Degree (One-Hot Encoding)
        if 'degree' in df.columns:
            degree_encoded = self.degree_encoder.fit_transform(df[['degree']])
            degree_df = pd.DataFrame(degree_encoded, columns=self.degree_encoder.get_feature_names_out(['degree']))
            df = pd.concat([df, degree_df], axis=1)
            
        # 2. Specialization (One-Hot Encoding)
        if 'specialization' in df.columns:
            spec_encoded = self.spec_encoder.fit_transform(df[['specialization']])
            spec_df = pd.DataFrame(spec_encoded, columns=self.spec_encoder.get_feature_names_out(['specialization']))
            df = pd.concat([df, spec_df], axis=1)

        # 3. Skills (Multi-Label Encoding for lists)
        if 'skills' in df.columns:
            # Ensure skills are lists
            df['skills'] = df['skills'].apply(lambda x: x if isinstance(x, list) else [])
            skills_encoded = self.skills_mlb.fit_transform(df['skills'])
            skills_df = pd.DataFrame(skills_encoded, columns=[f"skill_{s}" for s in self.skills_mlb.classes_])
            df = pd.concat([df, skills_df], axis=1)

        return df

    def normalize_numerical_data(self, df):
        """
        Normalize CGPA and Marks.
        """
        print("Normalizing data...")
        numeric_cols = ['cgpa'] # Add 'marks' if exists
        
        # Check available columns
        cols_to_normalize = [c for c in numeric_cols if c in df.columns]
        
        if cols_to_normalize:
            df[cols_to_normalize] = self.scaler.fit_transform(df[cols_to_normalize])
            
        return df

    def run_pipeline(self, raw_data):
        df = self.load_data(raw_data)
        df = self.clean_educational_data(df)
        df = self.encode_categorical_fields(df)
        df = self.normalize_numerical_data(df)
        return df

# Example Usage / Verification
if __name__ == "__main__":
    # Mock Data matching the user's schema concept
    mock_data = [
        {
            "id": 1,
            "degree": "B. Tech",
            "specialization": "Computer Science",
            "cgpa": 8.5,
            "skills": ["Python", "SQL"]
        },
        {
            "id": 2,
            "degree": "B.E",
            "specialization": "Civil Engineering",
            "cgpa": 7.2,
            "skills": ["Communication", "AutoCAD"]
        },
        {
            "id": 3,
            "degree": None, # Missing value to test cleaning
            "specialization": "Information Technology",
            "cgpa": None,   # Missing value to test imputation
            "skills": ["Java"]
        },
        {
            "id": 4,
            "degree": "B. Tech",
            "specialization": "Computer Science",
            "cgpa": 9.0,
            "skills": ["Python", "Machine Learning", "Data Analysis"]
        }
    ]

    print("Raw Data:")
    print(pd.DataFrame(mock_data))
    print("\n" + "="*50 + "\n")

    preprocessor = DataPreprocessor()
    processed_df = preprocessor.run_pipeline(mock_data)

    print("Processed Data Head:")
    print(processed_df.head())
    
    print("\nColumns:", processed_df.columns.tolist())
