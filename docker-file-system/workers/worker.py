import os
from flask import Flask, request, jsonify
from db import save_lines, get_lines_by_worker

app = Flask(__name__)

WORKER_ID = os.environ.get("WORKER_ID", "worker1")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "worker": WORKER_ID})


@app.route("/process", methods=["POST"])
def process():
    """
    Recibe un fragmento del archivo desde el backend y lo guarda en MySQL.
    Payload esperado:
    {
        "worker_id": "worker1",
        "lines": ["linea 1", "linea 2", ...]
    }
    """
    data = request.get_json()
    if not data or "lines" not in data:
        return jsonify({"status": "error", "message": "Payload inválido"}), 400

    worker_id = data.get("worker_id", WORKER_ID)
    lines = data["lines"]

    try:
        save_lines(worker_id, lines)
        return jsonify({
            "status": "completed",
            "worker_id": worker_id,
            "lines_processed": len(lines)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/results/<worker_id>", methods=["GET"])
def results(worker_id):
    """Devuelve las líneas procesadas por un worker específico."""
    rows = get_lines_by_worker(worker_id)
    return jsonify({"worker_id": worker_id, "results": rows})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6000, debug=False)
