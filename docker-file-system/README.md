# Docker File System

Sistema de archivos distribuido implementado con Docker, Flask y PostgreSQL.

## Estructura del Proyecto

```
docker-file-system/
├── docker-compose.yml        # Orquestación de servicios
├── backend/                  # API principal (Flask)
│   ├── app.py                # Rutas REST
│   ├── splitter.py           # División y reconstrucción de archivos
│   ├── worker_client.py      # Comunicación con workers
│   ├── requirements.txt
│   └── Dockerfile
├── workers/                  # Nodos de almacenamiento
│   ├── worker.py             # Servidor de chunks
│   ├── db.py                 # Acceso a base de datos
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # Interfaz web
│   ├── index.html
│   ├── app.js
│   └── style.css
├── database/
│   └── init.sql              # Esquema inicial
└── docs/
    ├── arquitectura.png
    └── bitacora.md
```

## Servicios

| Servicio   | Puerto | Descripción                        |
|------------|--------|------------------------------------|
| frontend   | 80     | Interfaz web (Nginx)               |
| backend    | 5000   | API REST (Flask)                   |
| worker     | 6000   | Nodo de almacenamiento de chunks   |
| db         | 5432   | Base de datos PostgreSQL           |

## Inicio rápido

```bash
docker-compose up --build
```

Luego abre `http://localhost` en tu navegador.
