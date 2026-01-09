import requests
import json

url = "http://localhost:5000/predict"

# Test Case 1: Software Developer signals
payload1 = {
    "degree": "B.Tech",
    "specialization": "Computer Science",
    "cgpa": 8.5,
    "skills": ["Java", "React", "Node.js"],
    "placementStatus": [],
    "certifications": ["Full Stack"],
    "project_count": 5
}

# Test Case 2: ML Engineer signals
payload2 = {
    "degree": "M.Sc",
    "specialization": "Data Science",
    "cgpa": 9.0,
    "skills": ["Python", "TensorFlow", "scikit-learn"],
    "placementStatus": [{"type": "Internship", "role": "ML Intern"}],
    "certifications": ["Deep Learning Specialization"],
    "project_count": 4
}

with open('test_output.txt', 'w') as f:
    try:
        f.write("Sending Request 1 (Expect Software Developer)...\n")
        res1 = requests.post(url, json=payload1)
        if res1.status_code == 200:
            data = res1.json()
            f.write(f"Result 1: {data.get('role')} ({data.get('confidence')})\n")
        else:
            f.write(f"Error 1: {res1.text}\n")

        f.write("\nSending Request 2 (Expect ML Engineer/Data Scientist)...\n")
        res2 = requests.post(url, json=payload2)
        if res2.status_code == 200:
            data = res2.json()
            f.write(f"Result 2: {data.get('role')} ({data.get('confidence')})\n")
        else:
            f.write(f"Error 2: {res2.text}\n")

    except Exception as e:
        f.write(f"Connection failed: {e}\n")
