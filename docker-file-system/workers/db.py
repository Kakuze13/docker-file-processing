import os
import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://user:password@db:5432/filesdb")


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def save_chunk(file_id, chunk_id, data):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO chunks (file_id, chunk_id, data) VALUES (%s, %s, %s) "
        "ON CONFLICT (file_id, chunk_id) DO UPDATE SET data = EXCLUDED.data",
        (file_id, chunk_id, data),
    )
    conn.commit()
    cur.close()
    conn.close()


def get_chunk(file_id, chunk_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT data FROM chunks WHERE file_id = %s AND chunk_id = %s", (file_id, chunk_id))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row[0] if row else None
