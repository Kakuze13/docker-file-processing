from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from app.splitter import read_lines, split_lines
from app.worker_client import WorkerClient

app = FastAPI(title="Distributed File Processor", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://127.0.0.1"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKER_PROCESS_URLS = [
    "http://worker1:6000/process",
    "http://worker2:6000/process",
    "http://worker3:6000/process",
    "http://worker4:6000/process",
    "http://worker5:6000/process",
]


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Recibe un archivo de texto, divide su contenido en 5 fragmentos
    y envía cada fragmento a un worker diferente.
    """
    if not file.filename or not file.filename.lower().endswith(".txt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe tener extensión .txt",
        )

    raw_content = await file.read()
    try:
        content = raw_content.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo decodificar el archivo como texto UTF-8",
        ) from exc

    lines = read_lines(content)
    chunks = split_lines(lines, num_chunks=len(WORKER_PROCESS_URLS))

    worker_responses = []
    for index, chunk in enumerate(chunks, start=1):
        client = WorkerClient(WORKER_PROCESS_URLS[index - 1])
        response_data = await client.send_chunk(worker_id=index, lines=chunk)
        worker_responses.append(response_data)
        print(f"[upload] Respuesta worker {index}: {response_data}")

    return {
        "filename": file.filename,
        "total_lines": len(lines),
        "num_chunks": len(chunks),
        "chunk_sizes": [len(chunk) for chunk in chunks],
        "worker_responses": worker_responses,
    }
