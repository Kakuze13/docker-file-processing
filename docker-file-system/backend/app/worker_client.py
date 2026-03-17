from typing import List

import httpx


class WorkerClient:
    """
    Cliente para comunicarse con los workers de procesamiento.

    TODO:
        - Recibir la URL base del worker desde configuración (env vars).
        - Implementar `get_result()` para recuperar el resultado procesado.
        - Añadir manejo de errores y reintentos.
    """

    def __init__(self, worker_url: str):
        """
        Args:
            worker_url: URL del endpoint del worker (ej. "http://worker1:6000/process").
        """
        self.worker_url = worker_url

    async def send_chunk(self, worker_id: int, lines: List[str]) -> dict:
        """
        Envía un fragmento de líneas al worker para su procesamiento.

        Args:
            worker_id: Identificador del worker destino (1-5).
            lines:     Lista de líneas que componen el fragmento.

        Returns:
            Respuesta del worker como diccionario.

        """
        payload = {
            "worker_id": worker_id,
            "lines": lines,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.worker_url, json=payload)
                response.raise_for_status()
            return {
                "status": "ok",
                "worker_url": self.worker_url,
                "data": response.json(),
            }
        except httpx.HTTPStatusError as exc:
            return {
                "status": "error",
                "worker_url": self.worker_url,
                "detail": f"Worker respondió con error HTTP {exc.response.status_code}",
            }
        except httpx.RequestError as exc:
            return {
                "status": "error",
                "worker_url": self.worker_url,
                "detail": f"No se pudo conectar al worker: {str(exc)}",
            }

    async def get_result(self, chunk_id: int) -> dict:
        """
        Recupera el resultado procesado de un fragmento específico.

        Args:
            chunk_id: Identificador del fragmento a recuperar.

        Returns:
            Resultado procesado como diccionario.

        TODO: Implementar con httpx.AsyncClient
        """
        raise NotImplementedError
