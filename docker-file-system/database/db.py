import mysql.connector
from mysql.connector import Error
import os

def conectar_bd():
    """Establece la conexión con la base de datos MySQL en Docker."""
    try:
        # En Docker, el 'host' es el nombre del servicio de la base de datos
        conexion = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'db'), 
            database=os.getenv('DB_NAME', 'sistemas_distribuidos'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'root')
        )
        return conexion
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

def guardar_linea(worker_id, contenido_linea):
    """Guarda una línea procesada en la base de datos."""
    conexion = conectar_bd()
    if conexion is not None:
        try:
            cursor = conexion.cursor()
            consulta = """INSERT INTO lineas_procesadas (worker_id, contenido_linea) 
                          VALUES (%s, %s)"""
            datos = (worker_id, contenido_linea)
            
            cursor.execute(consulta, datos)
            conexion.commit() # Confirma el guardado
            print(f"[{worker_id}] Línea guardada en BD exitosamente.")
            
        except Error as e:
            print(f"Error al insertar datos: {e}")
        finally:
            if conexion.is_connected():
                cursor.close()
                conexion.close()    
