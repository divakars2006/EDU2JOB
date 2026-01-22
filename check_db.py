import sqlite3
import os

DB_PATH = 'backend/database.db'

def check_admin():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, username, password FROM admin_users")
        users = cur.fetchall()
        
        print("\n--- Admin Users in DB ---")
        if not users:
            print("No admin users found!")
        for u in users:
            print(f"ID: {u[0]}, Username: '{u[1]}', Password: '{u[2]}'")
            
        conn.close()
    except Exception as e:
        print(f"Error reading DB: {e}")

if __name__ == "__main__":
    check_admin()
