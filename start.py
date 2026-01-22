import subprocess
import time
import os
import signal
import sys
from threading import Thread

def run_backend():
    print("Starting Backend...")
    # Run from root, assuming backend runs in backend dir
    subprocess.run("cd backend && python api.py", shell=True)

def run_frontend():
    print("Starting Frontend...")
    subprocess.run("cd frontend && npm run dev", shell=True)

if __name__ == "__main__":
    print("Initializing Job Prediction App (Frontend + Backend)...")
    
    # Check if node_modules exists, offer install if not? 
    # For now, assume installed or user will see errors.
    
    # We use threads to run them concurrently
    # Note: subprocess.run is blocking, so we need threads.
    
    b_thread = Thread(target=run_backend)
    f_thread = Thread(target=run_frontend)
    
    b_thread.daemon = True
    f_thread.daemon = True
    
    b_thread.start()
    f_thread.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping services...")
        # Since we used shell=True and threads, killing is tricky without complex logic.
        # But Ctrl+C usually propagates to subprocesses in basic shells.
        sys.exit(0)
