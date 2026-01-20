
import requests
import json

BASE_URL = "http://localhost:5000/predict"

def test_prediction(skills, description):
    print(f"\n--- Testing: {description} ---")
    payload = {
        "degree": "B.Tech",
        "specialization": "Computer Science",
        "skills": skills,
        "placementStatus": [],
        "certifications": [],
        "project_count": 3
    }
    
    try:
        response = requests.post(BASE_URL, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"Predicted Role: {data.get('role')}")
            print(f"Missing Skills: {data.get('missing_skills')}")
            
            with open("results.txt", "a") as f:
                f.write(f"--- {description} ---\n")
                f.write(f"Role: {data.get('role')}\n")
                f.write(f"Missing: {json.dumps(data.get('missing_skills'))}\n\n")

        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Test 1: ML Engineer target (partial skills)
    # ML Engineer needs: Python, Machine Learning, Deep Learning, SQL, TensorFlow, Keras
    test_prediction(
        ["Python", "SQL"], 
        "ML Engineer candidate with missing skills"
    )

    # Test 2: Software Developer target (missing Node.js)
    # Software Developer needs: Java, Python, JavaScript, React, SQL, Git, Node.js
    test_prediction(
        ["Java", "Python", "JavaScript", "React", "SQL", "Git"], 
        "Software Developer candidate missing Node.js"
    )

    # Test 3: No skills
    test_prediction(
        [], 
        "Candidate with no skills"
    )
