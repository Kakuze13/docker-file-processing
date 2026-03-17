import os
import time
import mysql.connector


def get_connection():
    """
    Retorna una conexión a MySQL usando variables de entorno.
    Reintenta hasta 10 veces para esperar que el contenedor de MySQL esté listo.
    """
    host     = os.environ.get("DB_HOST", "db")
    database = os.environ.get("DB_NAME", "sistemas_distribuidos")
    user     = os.environ.get("DB_USER", "root")
    password = os.environ.get("DB_PASSWORD", "root")

    for attempt in range(10):
        try:
            conn = mysql.connector.connect(
                host=host,
                database=database,
                user=user,
                password=password
            )
            return conn
        except mysql.connector.Error:
            print(f"[db] MySQL no disponible, reintentando ({attempt + 1}/10)...")
            time.sleep(3)

    raise RuntimeError("No se pudo conectar a MySQL después de 10 intentos.")


def save_lines(worker_id: str, lines: list):
    """
    Guarda las líneas procesadas en la tabla lineas_procesadas.
    """
    conn = get_connection()
    cur = conn.cursor()
    for line in lines:
        cur.execute(
            "INSERT INTO lineas_procesadas (worker_id, contenido_linea) VALUES (%s, %s)",
            (worker_id, line.strip())
        )
    conn.commit()
    cur.close()
    conn.close()


def get_lines_by_worker(worker_id: str) -> list:
    """
    Retorna todas las líneas guardadas por un worker específico.
    """
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT id, worker_id, contenido_linea, fecha_procesamiento "
        "FROM lineas_procesadas WHERE worker_id = %s ORDER BY id",
        (worker_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    # Convertir datetime a string para que sea serializable en JSON
    for row in rows:
        if row.get("fecha_procesamiento"):
            row["fecha_procesamiento"] = str(row["fecha_procesamiento"])
    return rows
