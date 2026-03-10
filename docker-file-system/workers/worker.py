from flask import Flask, request, jsonify
from db import save_chunk, get_chunk

app = Flask(__name__)


@app.route("/store", methods=["POST"])
def store_chunk():
    data = request.get_json()
    chunk_id = data["chunk_id"]
    file_id = data["file_id"]
    chunk_data = data["data"]
    save_chunk(file_id, chunk_id, chunk_data)
    return jsonify({"status": "ok", "chunk_id": chunk_id})


@app.route("/retrieve/<file_id>/<int:chunk_id>", methods=["GET"])
def retrieve_chunk(file_id, chunk_id):
    chunk_data = get_chunk(file_id, chunk_id)
    return jsonify({"chunk_id": chunk_id, "data": chunk_data})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6000, debug=True)
