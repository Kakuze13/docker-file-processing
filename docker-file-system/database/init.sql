-- Crear la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS sistemas_distribuidos;

-- Usar esa base de datos
USE sistemas_distribuidos;

-- Crear la tabla para guardar las líneas procesadas
CREATE TABLE IF NOT EXISTS lineas_procesadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id VARCHAR(50) NOT NULL,
    contenido_linea TEXT NOT NULL,
    fecha_procesamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
