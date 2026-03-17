const API_URL = "http://localhost:5000";

const fileInput = document.getElementById("file-input");
const uploadBtn = document.getElementById("upload-btn");
const statusMessage = document.getElementById("status-message");
const resultsSection = document.getElementById("results-section");
const summaryCards = document.getElementById("summary-cards");
const chunksGrid = document.getElementById("chunks-grid");
const workersGrid = document.getElementById("workers-grid");

uploadBtn.addEventListener("click", handleUpload);

async function handleUpload() {
  const file = fileInput.files[0];
  if (!file) {
    setStatus("error", "Selecciona un archivo .txt antes de procesar.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Procesando...";
    setStatus("loading", "Enviando archivo y distribuyendo fragmentos entre workers...");

    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || "No se pudo procesar el archivo");
    }

    renderUploadResult(result);
    setStatus("ok", "Archivo procesado correctamente. Revisa el panel de resultados.");
  } catch (error) {
    resultsSection.hidden = true;
    setStatus("error", `Error: ${error.message}`);
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Procesar archivo";
  }
}

function setStatus(type, message) {
  statusMessage.className = "status-message";
  if (type === "loading") {
    statusMessage.classList.add("status-loading");
  }
  if (type === "ok") {
    statusMessage.classList.add("status-ok");
  }
  if (type === "error") {
    statusMessage.classList.add("status-error");
  }
  statusMessage.textContent = message;
}

function renderUploadResult(result) {
  resultsSection.hidden = false;

  const chunkSizes = result.chunk_sizes || [];
  const workerResponses = result.worker_responses || [];
  const workersOk = workerResponses.filter((item) => item.status === "ok").length;

  renderSummaryCards({
    filename: result.filename,
    totalLines: result.total_lines,
    numChunks: result.num_chunks,
    workersOk,
    totalWorkers: workerResponses.length,
    chunkSizes,
  });
  renderChunkCards(chunkSizes, result.total_lines || 0);
  renderWorkerCards(workerResponses);
}

function renderSummaryCards(data) {
  summaryCards.innerHTML = "";

  const isIdeal100 =
    Number(data.totalLines) === 100 &&
    data.chunkSizes.length === 5 &&
    data.chunkSizes.every((size) => size === 20);

  const cards = [
    { title: "Archivo", value: data.filename || "Sin nombre" },
    { title: "Lineas totales", value: String(data.totalLines ?? 0) },
    { title: "Workers OK", value: `${data.workersOk}/${data.totalWorkers}` },
    {
      title: "Distribucion",
      value: isIdeal100 ? "Ideal 20x5" : "Balanceada automaticamente",
    },
  ];

  cards.forEach((item) => {
    const card = document.createElement("article");
    card.className = "summary-card";

    const title = document.createElement("p");
    title.className = "summary-title";
    title.textContent = item.title;

    const value = document.createElement("p");
    value.className = "summary-value";
    value.textContent = item.value;

    card.append(title, value);
    summaryCards.appendChild(card);
  });
}

function renderChunkCards(chunkSizes, totalLines) {
  chunksGrid.innerHTML = "";

  let startLine = 1;
  chunkSizes.forEach((size, index) => {
    const endLine = startLine + size - 1;
    const percentage = totalLines > 0 ? Math.round((size / totalLines) * 100) : 0;

    const card = document.createElement("article");
    card.className = "chunk-card";

    const header = document.createElement("div");
    header.className = "chunk-header";

    const title = document.createElement("strong");
    title.textContent = `Fragmento ${index + 1}`;

    const chip = document.createElement("span");
    chip.className = "chip chip-ok";
    chip.textContent = `${size} lineas`;

    header.append(title, chip);

    const rangeText = document.createElement("p");
    rangeText.className = "muted";
    if (size > 0) {
      rangeText.textContent = `Rango estimado: linea ${startLine} a ${endLine} | Worker ${index + 1}`;
    } else {
      rangeText.textContent = `Sin lineas asignadas | Worker ${index + 1}`;
    }

    const barWrap = document.createElement("div");
    barWrap.className = "bar-wrap";

    const barFill = document.createElement("div");
    barFill.className = "bar-fill";
    barFill.style.width = `${percentage}%`;

    barWrap.appendChild(barFill);

    const share = document.createElement("p");
    share.className = "muted";
    share.textContent = `${percentage}% del archivo`;

    card.append(header, rangeText, barWrap, share);
    chunksGrid.appendChild(card);

    startLine = endLine + 1;
  });
}

function renderWorkerCards(workerResponses) {
  workersGrid.innerHTML = "";

  workerResponses.forEach((workerResponse, index) => {
    const card = document.createElement("article");
    const isOk = workerResponse.status === "ok";
    card.className = `worker-card ${isOk ? "ok" : "error"}`;

    const header = document.createElement("div");
    header.className = "worker-header";

    const workerName = document.createElement("strong");
    workerName.textContent = `Worker ${index + 1}`;

    const state = document.createElement("span");
    state.className = `chip ${isOk ? "chip-ok" : "chip-error"}`;
    state.textContent = isOk ? "OK" : "ERROR";

    header.append(workerName, state);

    const linesProcessed = workerResponse?.data?.lines_processed;
    const workerId = workerResponse?.data?.worker_id;
    const detail = workerResponse?.detail || "Procesado correctamente";

    const body1 = document.createElement("p");
    body1.className = "muted";
    body1.textContent = isOk
      ? `Lineas procesadas: ${linesProcessed ?? "N/D"} | Worker ID: ${workerId ?? "N/D"}`
      : detail;

    const body2 = document.createElement("p");
    body2.className = "muted";
    body2.textContent = `Endpoint: ${workerResponse.worker_url || "N/D"}`;

    card.append(header, body1, body2);
    workersGrid.appendChild(card);
  });
}
