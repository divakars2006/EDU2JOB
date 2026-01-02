
import requests
import json

url = 'http://localhost:5000/predict'
results = {}

# Case 1: Pure ML Engineer profile (should NOT be adjusted)
print("\n--- Test Case 1: ML Engineer Profile (No DS signals) ---")
payload_ml = {
    'user_id': 'test_ml',
    'degree': 'B.Tech',
    'specialization': 'Computer Science',
    'cgpa': 9.0,
    'skills': ['Python', 'TensorFlow', 'Deep Learning'],
    'placementStatus': []
}
try:
    resp = requests.post(url, json=payload_ml)
    data = resp.json()
    results['case_1'] = data
except Exception as e:
    results['case_1_error'] = str(e)

# Case 2: ML Engineer profile BUT with DS signals (should BE adjusted)
print("\n--- Test Case 2: ML Engineer Profile + DS Signals (Skills + Specialization) ---")
payload_ds_signal = {
    'user_id': 'test_ds_signal',
    'degree': 'B.Tech',
    'specialization': 'Data Science', # Signal 1
    'cgpa': 9.0,
    'skills': ['Python', 'TensorFlow', 'Deep Learning', 'R', 'Statistics', 'Pandas'], # Signal 2
    'placementStatus': [{'role': 'Junior Data Scientist', 'type': 'Internship'}] # Signal 3
}
try:
    resp = requests.post(url, json=payload_ds_signal)
    data = resp.json()
    results['case_2'] = data
except Exception as e:
    results['case_2_error'] = str(e)

with open('test_results.json', 'w') as f:
    json.dump(results, f, indent=2)

