# Bitácora del Proyecto

## docker-file-system — Sistema de Archivos Distribuido

---

### Semana 1

**Fecha:** 2026-03-10

**Actividades realizadas:**
- Definición de la arquitectura del sistema.
- Creación de la estructura inicial del proyecto.
- Configuración de `docker-compose.yml` con servicios: backend, workers, frontend y base de datos.

**Decisiones tomadas:**
- Uso de PostgreSQL como base de datos central para almacenar metadatos y chunks.
- Backend en Flask (Python).
- Frontend estático servido con Nginx.

**Pendientes:**
- Implementar lógica de splitting de archivos en `splitter.py`.
- Implementar comunicación backend ↔ workers.
- Diseñar diagrama de arquitectura.

---

### Semana 2

**Fecha:** 2026-03-17

**Integrante:** Jose Daniel Perdomo Lara

**Rol:** Workers + Docker

---

#### Problemas encontrados en el código base

Al revisar los archivos heredados de la semana anterior se identificaron tres inconsistencias críticas:

1. **Incompatibilidad de base de datos:** El archivo `workers/db.py` usaba `psycopg2`, que es el conector de **PostgreSQL**, pero el `docker-compose.yml` levantaba un contenedor de **MySQL 8.0**. Esto hubiera causado un error de conexión en tiempo de ejecución.

2. **docker-compose incompleto:** El servicio `worker` estaba definido como un solo contenedor genérico, sin los 5 workers independientes que requiere la arquitectura del sistema.

3. **Endpoint incorrecto en el worker:** El `worker.py` original exponía `POST /store` y `GET /retrieve/<file_id>/<chunk_id>`, que no coincidían con el contrato definido por el backend (`POST /process` con payload `{ "worker_id": ..., "lines": [...] }`).

---

#### Cambios realizados

**`workers/db.py` — reescrito**

Se reemplazó `psycopg2` por `mysql-connector-python` para que el worker se conecte correctamente a MySQL. Se agregó lógica de reintento automático (hasta 10 intentos con 3 segundos de espera entre cada uno) para manejar el caso en que el contenedor de MySQL tarde en estar disponible al levantar el sistema. Esta práctica de "retry on startup" es un patrón estándar en sistemas distribuidos con Docker.

- Referencia: [Documentación oficial de mysql-connector-python](https://dev.mysql.com/doc/connector-python/en/)
- Referencia patrón retry: [Docker docs — Control startup order](https://docs.docker.com/compose/startup-order/)

**`workers/worker.py` — reescrito**

Se redefinieron los endpoints del worker para que sean compatibles con lo que el backend envía:

- `POST /process` — recibe `{ "worker_id": "worker1", "lines": [...] }`, guarda las líneas en MySQL y responde con el estado.
- `GET /health` — permite verificar que el contenedor está activo (útil para diagnóstico y para el frontend).
- `GET /results/<worker_id>` — permite consultar las líneas procesadas por un worker específico.

El `WORKER_ID` se lee desde una variable de entorno para que el mismo código sirva para los 5 contenedores sin modificación.

- Referencia: [Flask documentation — Quickstart](https://flask.palletsprojects.com/en/3.0.x/quickstart/)

**`workers/requirements.txt` — actualizado**

Se reemplazó `psycopg2-binary==2.9.9` por `mysql-connector-python==8.3.0` para que la imagen Docker instale el conector correcto.

**`docker-compose.yml` — expandido**

Se reemplazó el servicio `worker` genérico por 5 servicios independientes (`worker1` a `worker5`), cada uno con:

- Su propio `container_name` para identificación.
- Variable de entorno `WORKER_ID` con su nombre correspondiente.
- Puerto mapeado individualmente (6001 al 6005) para poder probarlos de forma independiente desde el host.
- `depends_on` con `condition: service_healthy` apuntando al servicio `db`, de modo que ningún worker arranque antes de que MySQL esté listo.

Se agregó también un `healthcheck` al servicio `db` usando `mysqladmin ping`, que es el método recomendado oficialmente para verificar disponibilidad de MySQL en Docker.

- Referencia: [Docker Compose file reference — healthcheck](https://docs.docker.com/compose/compose-file/05-services/#healthcheck)
- Referencia: [MySQL Docker Hub — Environment Variables](https://hub.docker.com/_/mysql)

---

#### Resultado

Con estos cambios, los 5 workers pueden levantarse correctamente con:

```bash
docker-compose up --build
```

Cada worker queda accesible dentro de la red Docker en `http://workerN:6000` y desde el host en `http://localhost:600N`. El backend puede enviarles fragmentos del archivo haciendo `POST http://workerN:6000/process`.

---
