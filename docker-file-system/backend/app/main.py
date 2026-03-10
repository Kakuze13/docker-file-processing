from fastapi import FastAPI

app = FastAPI(title="Distributed File Processor", version="0.1.0")


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}
