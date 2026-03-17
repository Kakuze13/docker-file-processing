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
    if num_chunks <= 0:
        raise ValueError("num_chunks debe ser mayor que 0")

    if not lines:
        return [[] for _ in range(num_chunks)]

    base_size = len(lines) // num_chunks
    remainder = len(lines) % num_chunks

    chunks: List[List[str]] = []
    start = 0
    for index in range(num_chunks):
        # Reparte las líneas sobrantes entre los primeros fragmentos.
        current_size = base_size + (1 if index < remainder else 0)
        end = start + current_size
        chunks.append(lines[start:end])
        start = end

    return chunks


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
