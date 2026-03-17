# Docker File System

Sistema distribuido con FastAPI, 5 workers Flask, MySQL y frontend estatico en Nginx.

## Requerimientos generales

Para orquestar y ejecutar todo el sistema necesitas:

1. Docker Desktop instalado y corriendo.
2. Docker Engine 24+.
3. Docker Compose plugin 2.20+ (comando `docker compose`).
4. Puertos libres en tu host:
     - `80` (frontend)
     - `5000` (backend)
     - `3306` (MySQL)
     - `6001`, `6002`, `6003`, `6004`, `6005` (workers publicados)
5. Recursos recomendados para Docker Desktop:
     - 2 CPU
     - 4 GB RAM minimo
6. (Opcional) `git` para actualizar el repositorio.

## Dependencias por servicio

- Backend ([backend/requirements.txt](backend/requirements.txt)):
    - fastapi
    - uvicorn
    - httpx
    - python-multipart
- Workers ([workers/requirements.txt](workers/requirements.txt)):
    - flask
    - mysql-connector-python
- Base de datos:
    - imagen `mysql:8.0`
- Frontend:
    - imagen `nginx:alpine`

No necesitas instalar Python localmente para correr el sistema completo con Docker.

## Estructura

```
docker-file-system/
|- docker-compose.yml
|- backend/
|  |- Dockerfile
|  |- requirements.txt
|  \- app/
|     |- main.py
|     |- splitter.py
|     \- worker_client.py
|- workers/
|  |- Dockerfile
|  |- requirements.txt
|  |- worker.py
|  \- db.py
|- frontend/
|  |- index.html
|  |- app.js
|  \- style.css
\- database/
     |- init.sql
     \- db.py
```

## Levantar todo el sistema (orquestacion)

Desde la carpeta del proyecto:

```bash
cd docker-file-system
docker compose up --build
```

Para segundo plano:

```bash
docker compose up --build -d
```

Para detener:

```bash
docker compose down
```

Para detener y limpiar volumenes de BD:

```bash
docker compose down -v
```

## Verificacion rapida

1. Frontend: `http://localhost`
2. Backend health: `http://localhost:5000/health`
3. Workers health:
     - `http://localhost:6001/health`
     - `http://localhost:6002/health`
     - `http://localhost:6003/health`
     - `http://localhost:6004/health`
     - `http://localhost:6005/health`

## Flujo actual

1. Subir archivo `.txt` desde el frontend.
2. Backend recibe archivo en `POST /upload`.
3. Backend divide lineas en 5 fragmentos.
4. Backend envia cada fragmento a un worker distinto (`/process`).
5. Backend imprime en consola la respuesta de cada worker.

## Troubleshooting

### 1) `docker` no se reconoce

Instala Docker Desktop y reinicia terminal/PC. Si ya esta instalado, valida que Docker Desktop este iniciado.

### 2) Error al levantar `docker compose`

Ejecuta el comando dentro de `docker-file-system` (donde vive `docker-compose.yml`).

### 3) Puerto en uso

Si algun puerto esta ocupado, libera el puerto o cambia el mapeo en `docker-compose.yml`.

### 4) El frontend no puede llamar al backend

Verifica que backend este en `http://localhost:5000` y que el contenedor `backend` este en estado `Up`.
