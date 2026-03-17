    # Documentacion Tecnica del Proyecto

## 1. Resumen del proyecto

Este proyecto implementa un sistema distribuido para procesar archivos de texto usando una arquitectura por contenedores.

Flujo principal:

1. El usuario carga un archivo `.txt` desde el frontend.
2. El backend recibe el archivo y separa su contenido por lineas.
3. El backend divide las lineas en 5 fragmentos.
4. Cada fragmento se envia a un worker distinto.
5. Cada worker procesa y guarda lineas en MySQL.
6. El backend responde con el resumen del procesamiento y el estado por worker.

## 2. Objetivo funcional

Objetivo del sistema:

- Recibir un archivo de texto (caso esperado: 100 lineas).
- Distribuir su contenido de forma equilibrada entre 5 workers.
- Procesar en paralelo a nivel de arquitectura distribuida.
- Centralizar resultados en base de datos.

Nota:

- El backend actual divide cualquier cantidad de lineas en 5 partes equilibradas.
- Si son 100 lineas, el resultado es exactamente 20 lineas por worker.

## 3. Arquitectura general

Servicios orquestados con Docker Compose:

- `frontend` (Nginx): interfaz web y carga de archivos.
- `backend` (FastAPI): coordinador principal del flujo.
- `worker1..worker5` (Flask): nodos de procesamiento.
- `db` (MySQL 8): persistencia de lineas procesadas.

Puertos publicados:

- Frontend: `80:80`
- Backend: `5000:8000`
- MySQL: `3306:3306`
- Workers:
  - `6001:6000` (worker1)
  - `6002:6000` (worker2)
  - `6003:6000` (worker3)
  - `6004:6000` (worker4)
  - `6005:6000` (worker5)

## 4. Estructura del repositorio

```text
docker-file-system/
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
|- database/
|  |- init.sql
|  \- db.py
|- docs/
|  |- bitacora.md
|  \- documentacion-tecnica.md
\- docker-compose.yml
```

## 5. Backend (detalle especifico)

### 5.1 Rol del backend

El backend es el orquestador de negocio. Su responsabilidad es:

1. Validar entrada del cliente.
2. Convertir archivo en lineas.
3. Dividir lineas en fragmentos.
4. Enviar cada fragmento a un worker.
5. Consolidar y devolver respuesta final.

### 5.2 Stack y dependencias

Archivo: `backend/requirements.txt`

- `fastapi==0.111.0`
- `uvicorn[standard]==0.29.0`
- `httpx==0.27.0`
- `python-multipart==0.0.9`

### 5.3 Endpoints del backend

#### GET /health

Uso: validar que el backend esta vivo.

Respuesta:

```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

#### POST /upload

Uso: recibir archivo `.txt`, dividirlo y despachar fragmentos a workers.

Entrada:

- Tipo: `multipart/form-data`
- Campo esperado: `file`

Validaciones implementadas:

1. El nombre del archivo debe terminar en `.txt`.
2. El archivo debe poder decodificarse en UTF-8.

Errores controlados:

- `400 Bad Request` si extension no es `.txt`.
- `400 Bad Request` si no se puede decodificar UTF-8.

Respuesta de exito (estructura):

```json
{
  "filename": "archivo.txt",
  "total_lines": 100,
  "num_chunks": 5,
  "chunk_sizes": [20, 20, 20, 20, 20],
  "worker_responses": [
    {"status": "ok", "worker_url": "http://worker1:6000/process", "data": {...}},
    {"status": "ok", "worker_url": "http://worker2:6000/process", "data": {...}},
    {"status": "ok", "worker_url": "http://worker3:6000/process", "data": {...}},
    {"status": "ok", "worker_url": "http://worker4:6000/process", "data": {...}},
    {"status": "ok", "worker_url": "http://worker5:6000/process", "data": {...}}
  ]
}
```

### 5.4 Algoritmo de division (splitter.py)

Funciones:

- `read_lines(content: str) -> List[str]`
  - Convierte contenido de texto en lista de lineas.
- `split_lines(lines: List[str], num_chunks: int = 5) -> List[List[str]]`
  - Divide lineas en partes equilibradas.

Reglas tecnicas de `split_lines`:

1. Si `num_chunks <= 0`, lanza `ValueError`.
2. Si no hay lineas, retorna 5 listas vacias.
3. Calcula:
   - `base_size = len(lines) // num_chunks`
   - `remainder = len(lines) % num_chunks`
4. Reparte el sobrante (`remainder`) en los primeros fragmentos.

Ejemplo:

- 100 lineas, 5 chunks -> `[20, 20, 20, 20, 20]`
- 103 lineas, 5 chunks -> `[21, 21, 21, 20, 20]`

### 5.5 Comunicacion con workers (worker_client.py)

Clase: `WorkerClient`

Metodo implementado:

- `send_chunk(worker_id: int, lines: List[str]) -> dict`

Comportamiento:

1. Construye payload JSON:

```json
{
  "worker_id": 1,
  "lines": ["linea1", "linea2"]
}
```

2. Ejecuta `POST` async al endpoint del worker (timeout 10 segundos).
3. Si responde 2xx, retorna `status: ok` + respuesta del worker.
4. Si hay error HTTP o de red, retorna `status: error` + detalle.

### 5.6 Despacho a 5 workers en main.py

Lista fija de workers en backend:

- `http://worker1:6000/process`
- `http://worker2:6000/process`
- `http://worker3:6000/process`
- `http://worker4:6000/process`
- `http://worker5:6000/process`

Estrategia:

1. El chunk 1 se envia a worker1.
2. El chunk 2 se envia a worker2.
3. El chunk 3 se envia a worker3.
4. El chunk 4 se envia a worker4.
5. El chunk 5 se envia a worker5.

Adicional:

- Se imprime en consola la respuesta de cada worker para trazabilidad.

### 5.7 CORS

Configuracion habilitada para frontend local:

- `http://localhost`
- `http://127.0.0.1`

Permite metodos y headers completos para flujo de carga de archivos.

## 6. Workers (Flask)

### 6.1 Endpoints

#### GET /health

Devuelve estado del worker.

#### POST /process

Entrada esperada:

```json
{
  "worker_id": "worker1",
  "lines": ["linea 1", "linea 2"]
}
```

Comportamiento:

1. Valida que exista `lines`.
2. Inserta cada linea en MySQL.
3. Retorna cantidad de lineas procesadas.

#### GET /results/<worker_id>

Devuelve lineas almacenadas por worker.

### 6.2 Persistencia en workers/db.py

- Conexion a MySQL por variables de entorno.
- Reintento de conexion hasta 10 veces (espera de 3 segundos entre intentos).
- Insercion de cada linea en tabla `lineas_procesadas`.

## 7. Base de datos

Motor: MySQL 8

Script de inicializacion: `database/init.sql`

Tabla principal:

- `lineas_procesadas`
  - `id` (PK autoincrement)
  - `worker_id` (varchar)
  - `contenido_linea` (text)
  - `fecha_procesamiento` (timestamp)

## 8. Frontend

Responsabilidad:

1. Permitir seleccionar archivo desde navegador.
2. Ejecutar `POST /upload` al backend.
3. Mostrar en pantalla:
   - nombre de archivo,
   - total de lineas,
   - tamano por fragmento,
   - estado devuelto por cada worker.

## 9. Orquestacion (docker-compose)

Archivo: `docker-compose.yml`

Puntos clave:

1. Red comun para todos los servicios.
2. `db` con healthcheck para controlar orden de arranque.
3. `backend` y `workers` dependientes de `db` saludable.
4. 5 workers independientes con `WORKER_ID` distinto.

## 10. Pruebas realizadas

Se registraron pruebas funcionales del flujo principal y de casos de error.

### 10.1 Backend

1. `GET /health` responde estado correcto.
2. `POST /upload` con `.txt` valido:
   - separa lineas,
   - divide en 5 chunks,
   - despacha un chunk por worker,
   - retorna resumen y respuestas.
3. `POST /upload` con extension invalida:
   - responde `400`.
4. `POST /upload` con contenido no UTF-8:
   - responde `400`.

### 10.2 Workers

1. `GET /health` responde por cada worker.
2. `POST /process` persiste lineas en MySQL.
3. `GET /results/<worker_id>` lista registros guardados.

### 10.3 Integracion frontend-backend

1. Carga de archivo desde UI.
2. Visualizacion del estado por fragmento/worker.
3. Manejo de error visible en frontend si falla la peticion.

## 11. Estado actual del proyecto

Estado funcional:

- Recepcion de archivo: implementada.
- Division modular en 5 partes: implementada.
- Envio a workers por HTTP: implementado.
- Guardado en MySQL desde workers: implementado.
- Interaccion basica de usuario: implementada.

## 12. Mejoras recomendadas (siguiente iteracion)

1. Validar explicitamente el caso de 100 lineas en backend si es requisito estricto.
2. Paralelizar envios a workers con `asyncio.gather` para menor latencia.
3. Implementar `get_result()` en `worker_client.py`.
4. Agregar autenticacion basica entre servicios.
5. Añadir pruebas automatizadas (unitarias e integracion).
6. Incorporar observabilidad: logs estructurados y metricas.
