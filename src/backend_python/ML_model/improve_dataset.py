import pandas as pd
import numpy as np
import random

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

# Define the target number of samples per role
TARGET_SAMPLES = 200

# Define Roles and their realistic feature distributions
ROLES_CONFIG = {
    "ML Engineer": {
        "degrees": ["B.Tech", "M.Sc", "MCA", "MBA"],
        "degree_weights": [0.4, 0.3, 0.2, 0.1],
        "specializations": ["Artificial Intelligence", "Data Science", "Computer Science"],
        "spec_weights": [0.5, 0.4, 0.1],
        "cgpa_min": 7.5,
        "cgpa_max": 10.0,
        "internship_prob": 0.8,
        "certifications_prob": 0.9,
        "project_count_min": 2,
        "project_count_max": 8
    },
    "Data Scientist": {
        "degrees": ["M.Sc", "B.Tech", "MCA", "MBA"],
        "degree_weights": [0.4, 0.3, 0.2, 0.1],
        "specializations": ["Data Science", "Business Analytics", "Artificial Intelligence", "Computer Science"],
        "spec_weights": [0.5, 0.3, 0.1, 0.1],
        "cgpa_min": 7.5,
        "cgpa_max": 9.8,
        "internship_prob": 0.7,
        "certifications_prob": 0.8,
        "project_count_min": 2,
        "project_count_max": 6
    },
    "Data Analyst": {
        "degrees": ["B.Tech", "MBA", "M.Sc", "MCA"],
        "degree_weights": [0.4, 0.3, 0.2, 0.1],
        "specializations": ["Business Analytics", "Data Science", "Information Technology", "Computer Science"],
        "spec_weights": [0.6, 0.2, 0.1, 0.1],
        "cgpa_min": 6.5,
        "cgpa_max": 9.0,
        "internship_prob": 0.6,
        "certifications_prob": 0.6,
        "project_count_min": 1,
        "project_count_max": 4
    },
    "Software Developer": {
        "degrees": ["B.Tech", "MCA", "M.Sc", "MBA"],
        "degree_weights": [0.5, 0.3, 0.15, 0.05],
        "specializations": ["Computer Science", "Information Technology", "Artificial Intelligence"],
        "spec_weights": [0.6, 0.3, 0.1],
        "cgpa_min": 6.8,
        "cgpa_max": 9.5,
        "internship_prob": 0.6,
        "certifications_prob": 0.5,
        "project_count_min": 2,
        "project_count_max": 5
    },
   "Business Analyst": {
        "degrees": ["MBA", "B.Tech", "M.Sc", "MCA"],
        "degree_weights": [0.6, 0.2, 0.1, 0.1],
        "specializations": ["Business Analytics", "Information Technology", "Data Science"],
        "spec_weights": [0.7, 0.2, 0.1],
        "cgpa_min": 6.0,
        "cgpa_max": 8.5,
        "internship_prob": 0.5,
        "certifications_prob": 0.4,
        "project_count_min": 0,
        "project_count_max": 3
    }
}

def generate_sample(role):
    config = ROLES_CONFIG[role]
    
    degree = random.choices(config["degrees"], weights=config["degree_weights"])[0]
    specialization = random.choices(config["specializations"], weights=config["spec_weights"])[0]
    
    # Generate CGPA using normal distribution mostly, but clipped
    cgpa = round(random.uniform(config["cgpa_min"], config["cgpa_max"]), 2)
    
    internship = "Yes" if random.random() < config["internship_prob"] else "No"
    certifications = "Yes" if random.random() < config["certifications_prob"] else "No"
    
    project_count = random.randint(config["project_count_min"], config["project_count_max"])
    
    return {
        "degree": degree,
        "specialization": specialization,
        "cgpa": cgpa,
        "internship_experience": internship,
        "certifications": certifications,
        "project_count": project_count,
        "job_role": role
    }

def main():
    print("Generating balanced dataset...")
    
    all_data = []
    
    for role in ROLES_CONFIG.keys():
        print(f"Generating {TARGET_SAMPLES} samples for {role}...")
        for _ in range(TARGET_SAMPLES):
            all_data.append(generate_sample(role))
            
    df = pd.DataFrame(all_data)
    
    # Shuffle the dataset
    df = df.sample(frac=1).reset_index(drop=True)
    
    output_path = "src/backend_python/ML_model/job_roles_dataset.tsv"
    df.to_csv(output_path, sep='\t', index=False)
    
    print(f"Successfully saved {len(df)} records to {output_path}")
    print("\nClass Distribution:")
    print(df['job_role'].value_counts())
    
    print("\nSample Data:")
    print(df.head())

if __name__ == "__main__":
    main()
