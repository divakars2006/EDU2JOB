import sqlite3
import os

DB_PATH = 'src/database.db'

def check_and_migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check feedback table
    cursor.execute("PRAGMA table_info(feedback)")
    columns = [info[1] for info in cursor.fetchall()]
    
    print(f"Feedback table columns: {columns}")
    
    if 'prediction_id' not in columns:
        print("Migrating: Adding 'prediction_id' to feedback table...")
        try:
            cursor.execute("ALTER TABLE feedback ADD COLUMN prediction_id INTEGER")
            conn.commit()
            print("Migration successful.")
        except Exception as e:
            print(f"Migration failed: {e}")
    else:
        print("'prediction_id' column already exists.")

    conn.close()

if __name__ == "__main__":
    check_and_migrate()
