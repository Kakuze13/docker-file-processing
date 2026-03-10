from typing import List


def split_lines(lines: List[str], num_chunks: int = 5) -> List[List[str]]:
    """
    Divide una lista de líneas en `num_chunks` fragmentos de igual tamaño.

    Args:
        lines:       Lista de líneas del archivo de texto.
        num_chunks:  Número de fragmentos a generar (default 5).

    Returns:
        Lista de fragmentos, donde cada fragmento es una lista de líneas.

    TODO:
        - Manejar archivos cuyo total de líneas no sea divisible exactamente.
        - Agregar validación: archivo vacío, num_chunks <= 0, etc.
    """
    chunk_size = len(lines) // num_chunks
    return [lines[i * chunk_size:(i + 1) * chunk_size] for i in range(num_chunks)]


def read_lines(content: str) -> List[str]:
    """
    Convierte el contenido de un archivo de texto en una lista de líneas.

    Args:
        content: Contenido del archivo como string.

    Returns:
        Lista de líneas sin el carácter de nueva línea.

    TODO:
        - Filtrar líneas vacías si es necesario.
        - Soportar diferentes encodings.
    """
    return content.splitlines()
