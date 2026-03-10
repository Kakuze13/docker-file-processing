from typing import List


class WorkerClient:
    """
    Cliente para comunicarse con los workers de procesamiento.

    TODO:
        - Recibir la URL base del worker desde configuración (env vars).
        - Implementar `send_chunk()` usando httpx para envío async.
        - Implementar `get_result()` para recuperar el resultado procesado.
        - Añadir manejo de errores y reintentos.
    """

    def __init__(self, worker_url: str):
        """
        Args:
            worker_url: URL base del worker (ej. "http://worker1:6000").
        """
        self.worker_url = worker_url

    async def send_chunk(self, chunk_id: int, lines: List[str]) -> dict:
        """
        Envía un fragmento de líneas al worker para su procesamiento.

        Args:
            chunk_id: Identificador del fragmento (0-4).
            lines:    Lista de líneas que componen el fragmento.

        Returns:
            Respuesta del worker como diccionario.

        TODO: Implementar con httpx.AsyncClient
        """
        raise NotImplementedError

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
