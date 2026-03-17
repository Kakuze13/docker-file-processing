const API_URL = "http://localhost:5000";

document.getElementById("upload-btn").addEventListener("click", async () => {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  if (!file) return alert("Selecciona un archivo primero.");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || "No se pudo procesar el archivo");
    }

    console.log("Upload result:", result);
    renderUploadResult(result);
  } catch (error) {
    const list = document.getElementById("file-list");
    list.innerHTML = `<li>Error: ${error.message}</li>`;
  }
});

function renderUploadResult(result) {
  const list = document.getElementById("file-list");
  list.innerHTML = "";

  const summary = document.createElement("li");
  summary.textContent = `Archivo: ${result.filename} | Lineas: ${result.total_lines} | Fragmentos: ${result.num_chunks}`;
  list.appendChild(summary);

  (result.chunk_sizes || []).forEach((size, index) => {
    const li = document.createElement("li");
    li.textContent = `Fragmento ${index + 1}: ${size} lineas`;
    list.appendChild(li);
  });

  (result.worker_responses || []).forEach((workerResponse, index) => {
    const li = document.createElement("li");
    const detail = workerResponse.detail || "Procesado";
    li.textContent = `Worker ${index + 1} (${workerResponse.status}): ${detail}`;
    list.appendChild(li);
  });
}
