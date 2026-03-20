import os

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    if DATABASE_URL:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(DATABASE_URL)
        conn.cursor_factory = psycopg2.extras.RealDictCursor
    else:
        import sqlite3
        conn = sqlite3.connect('meals.db')
        conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()

    if DATABASE_URL:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id         SERIAL PRIMARY KEY,
                username   TEXT NOT NULL UNIQUE,
                email      TEXT NOT NULL UNIQUE,
                password   TEXT NOT NULL,
                tags       TEXT NOT NULL DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS meals (
                id         SERIAL PRIMARY KEY,
                user_id    INTEGER NOT NULL REFERENCES users(id),
                title      TEXT NOT NULL,
                type       TEXT NOT NULL,
                meal_time  TEXT NOT NULL,
                includes   TEXT NOT NULL,
                tags       TEXT NOT NULL DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        cursor.close()
    else:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                username   TEXT NOT NULL UNIQUE,
                email      TEXT NOT NULL UNIQUE,
                password   TEXT NOT NULL,
                tags       TEXT NOT NULL DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS meals (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL,
                title      TEXT NOT NULL,
                type       TEXT NOT NULL,
                meal_time  TEXT NOT NULL,
                includes   TEXT NOT NULL,
                tags       TEXT NOT NULL DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        conn.commit()

    conn.close()
    print("✅ Database ready")