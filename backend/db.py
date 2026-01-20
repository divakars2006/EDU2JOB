import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv
import json

load_dotenv()

db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "password"),
    "database": os.getenv("DB_NAME", "job_prediction"),
    "pool_name": "mypool",
    "pool_size": 10
}

cnxpool = mysql.connector.pooling.MySQLConnectionPool(**db_config)

def get_db_connection():
    return cnxpool.get_connection()

def init_db():
    print("Connecting to MySQL database...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        create_table_query = """
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255),
            googleId VARCHAR(255),
            createdAt DATETIME,
            educations JSON,
            certifications JSON,
            skills JSON,
            placementStatus JSON
        )
        """
        cursor.execute(create_table_query)
        conn.commit()
        print("Users table checked/created")
        
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Database initialization error: {err}")
