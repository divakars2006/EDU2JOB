
import sqlite3
import os

DB_PATH = 'src/database.db'

def check_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    print("--- Checking Recent Predictions ---")
    cur.execute("SELECT id, user_id, role, timestamp FROM history ORDER BY timestamp DESC LIMIT 5")
    rows = cur.fetchall()
    for row in rows:
        print(dict(row))
        
    print("\n--- Checking Recent Feedback ---")
    cur.execute("SELECT id, prediction_id, user_id, predicted_role, relevance_rating FROM feedback ORDER BY timestamp DESC LIMIT 5")
    rows = cur.fetchall()
    for row in rows:
        print(dict(row))

    conn.close()

if __name__ == "__main__":
    check_db()
