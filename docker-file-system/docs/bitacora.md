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
