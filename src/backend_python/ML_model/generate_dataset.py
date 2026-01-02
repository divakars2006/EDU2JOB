import csv
import random

# Configuration
OUTPUT_FILE = "job_roles_dataset.tsv"
NUM_ROWS_PER_CLASS = 125  # Total ~500 rows
target_classes = ["ML Engineer", "Software Developer", "Data Scientist", "Business Analyst"]

# Allowed Values
degrees = ["B.Tech", "M.Sc", "MCA", "MBA"]
all_specializations = [
    "Computer Science", "Artificial Intelligence", "Data Science", "Electronics",
    "Information Technology", "Business Analytics"
]
programming_levels = ["Beginner", "Intermediate", "Advanced"]
binary_options = ["Yes", "No"]

def generate_row(role):
    # Common random attributes
    degree = random.choice(degrees)
    internship = random.choice(binary_options)
    
    # Role-specific logic
    # Role-specific logic
    if role == "ML Engineer":
        specialization = random.choice(["Artificial Intelligence", "Data Science"])
        # Mostly Advanced, some Intermediate
        skill_level = random.choices(["Advanced", "Intermediate"], weights=[0.8, 0.2])[0]
        project_count = random.randint(3, 6)
        certifications = random.choice(binary_options)
        
    elif role == "Software Developer":
        specialization = random.choice(["Computer Science", "Information Technology"])
        # Mostly Intermediate/Advanced, some Beginner (Junior devs)
        skill_level = random.choices(["Advanced", "Intermediate", "Beginner"], weights=[0.45, 0.45, 0.1])[0]
        project_count = random.randint(2, 6)
        certifications = random.choice(binary_options)
        
    elif role == "Data Scientist":
        specialization = "Data Science"
        # Mostly Advanced, some Intermediate
        skill_level = random.choices(["Advanced", "Intermediate"], weights=[0.8, 0.2])[0]
        project_count = random.randint(0, 6) 
        # Mostly Yes, some No
        certifications = random.choices(["Yes", "No"], weights=[0.8, 0.2])[0]
        
    elif role == "Business Analyst":
        specialization = "Business Analytics"
        # Mostly Beginner/Intermediate, some Advanced
        skill_level = random.choices(["Beginner", "Intermediate", "Advanced"], weights=[0.5, 0.4, 0.1])[0]
        project_count = random.randint(0, 6)
        certifications = random.choice(binary_options)
        
    else:
        # Fallback (should not happen)
        specialization = random.choice(all_specializations)
        skill_level = random.choice(programming_levels)
        project_count = random.randint(0, 6)
        certifications = random.choice(binary_options)

    return [
        degree,
        specialization,
        skill_level,
        internship,
        certifications,
        project_count,
        role
    ]

def main():
    header = [
        "degree", "specialization", "programming_skill_level", 
        "internship_experience", "certifications", "project_count", "job_role"
    ]
    
    rows = []
    for role in target_classes:
        for _ in range(NUM_ROWS_PER_CLASS):
            rows.append(generate_row(role))
    
    # Shuffle to mix classes
    random.shuffle(rows)
    
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerow(header)
        writer.writerows(rows)
        
    print(f"Generated {len(rows)} rows to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
