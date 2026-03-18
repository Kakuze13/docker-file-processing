const API_URL = "http://localhost:5000";

// Estado global
let allLines    = [];   // todas las líneas del archivo
let chunkRanges = [];   // [{start, end, worker}] después de procesar

// ── Verificar servicios ────────────────────────────────
async function checkServices() {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) setbadge("badge-backend", "online", "⬤ Backend");
  } catch {
    setbadge("badge-backend", "offline", "⬤ Backend");
  }
}
function setbadge(id, cls, text) {
  const el = document.getElementById(id);
  el.className = "badge " + cls;
  el.textContent = text;
}

// ── Drag & drop ────────────────────────────────────────
const dropZone  = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileInfo  = document.getElementById("file-info");
const uploadBtn = document.getElementById("upload-btn");
const btnText   = document.getElementById("btn-text");
const spinner   = document.getElementById("spinner");

dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const f = e.dataTransfer.files[0];
  if (f) applyFile(f);
});
fileInput.addEventListener("change", () => { if (fileInput.files[0]) applyFile(fileInput.files[0]); });

document.getElementById("btn-clear").addEventListener("click", () => {
  fileInput.value = "";
  fileInfo.style.display = "none";
  dropZone.style.display = "block";
  uploadBtn.disabled = true;
  btnText.textContent = "Selecciona un archivo primero";
  document.getElementById("viewer-section").style.display = "none";
  hideResults();
  allLines = [];
  chunkRanges = [];
});

function applyFile(file) {
  document.getElementById("file-name").textContent = file.name;
  document.getElementById("file-size").textContent = formatBytes(file.size);
  fileInfo.style.display  = "flex";
  dropZone.style.display  = "none";
  uploadBtn.disabled      = false;
  btnText.textContent     = "Procesar archivo";

  // Leer y mostrar contenido
  const reader = new FileReader();
  reader.onload = e => {
    allLines = e.target.result.split("\n").filter(l => l.trim() !== "");
    chunkRanges = [];
    renderViewer("all", "");
    document.getElementById("viewer-tabs").style.display = "none";
    document.getElementById("viewer-meta").textContent = allLines.length + " líneas";
    document.getElementById("viewer-section").style.display = "block";
  };
  reader.readAsText(file);
}

// ── Visor ──────────────────────────────────────────────
function renderViewer(workerFilter, searchTerm) {
  const tbody = document.getElementById("viewer-tbody");
  tbody.innerHTML = "";

  const term    = searchTerm.toLowerCase();
  let   matches = 0;

  allLines.forEach((line, i) => {
    const lineNum    = i + 1;
    const workerIdx  = chunkRanges.length > 0 ? getWorkerForLine(lineNum) : null;

    // Filtro por worker
    if (workerFilter !== "all" && workerIdx !== parseInt(workerFilter)) return;

    // Filtro búsqueda
    if (term && !line.toLowerCase().includes(term)) return;

    matches++;

    const tr = document.createElement("tr");
    tr.className = workerIdx ? `line-worker-${workerIdx}` : "";

    // Highlight búsqueda
    let displayLine = escapeHtml(line);
    if (term) {
      const re = new RegExp("(" + escapeRegex(term) + ")", "gi");
      displayLine = displayLine.replace(re, '<mark>$1</mark>');
    }

    // Badge worker (solo cuando ya se procesó)
    const workerBadge = workerIdx
      ? `<span class="line-worker-badge w${workerIdx}">w${workerIdx}</span>`
      : "";

    tr.innerHTML = `
      <td class="line-num">${lineNum}</td>
      <td class="line-content">${displayLine}</td>
      <td class="line-worker-cell">${workerBadge}</td>
    `;
    tbody.appendChild(tr);
  });

  // Contador búsqueda
  const countEl = document.getElementById("search-count");
  if (term) {
    countEl.textContent = matches + " resultado" + (matches !== 1 ? "s" : "");
    countEl.style.display = "inline";
  } else {
    countEl.style.display = "none";
  }
}

function getWorkerForLine(lineNum) {
  for (let i = 0; i < chunkRanges.length; i++) {
    if (lineNum >= chunkRanges[i].start && lineNum <= chunkRanges[i].end) return i + 1;
  }
  return null;
}

// Búsqueda en tiempo real
document.getElementById("viewer-search-input").addEventListener("input", function () {
  const activeTab = document.querySelector(".vtab.active");
  const worker    = activeTab ? activeTab.dataset.worker : "all";
  renderViewer(worker, this.value);
});

// Tabs de workers
document.getElementById("viewer-tabs").addEventListener("click", e => {
  const btn = e.target.closest(".vtab");
  if (!btn) return;
  document.querySelectorAll(".vtab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const search = document.getElementById("viewer-search-input").value;
  renderViewer(btn.dataset.worker, search);
});

// Mostrar/ocultar visor
document.getElementById("btn-toggle-viewer").addEventListener("click", function () {
  const box = document.getElementById("viewer-box");
  const tabs = document.getElementById("viewer-tabs");
  const search = document.querySelector(".viewer-search");
  const hidden = box.style.display === "none";
  box.style.display    = hidden ? "block" : "none";
  tabs.style.display   = (hidden && chunkRanges.length > 0) ? "flex" : (hidden ? "none" : "none");
  search.style.display = hidden ? "flex" : "none";
  this.textContent     = hidden ? "Ocultar" : "Mostrar";
});

// ── Upload ─────────────────────────────────────────────
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  uploadBtn.disabled  = true;
  btnText.textContent = "Procesando...";
  spinner.style.display = "block";
  hideError();
  hideResults();

  const formData = new FormData();
  formData.append("file", file);
  const t0 = Date.now();

  try {
    const res    = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
    const result = await res.json();
    if (!res.ok) throw new Error(result.detail || "Error al procesar el archivo");
    const elapsed = Date.now() - t0;

    // Calcular rangos por worker
    chunkRanges = [];
    let cursor = 1;
    (result.chunk_sizes || []).forEach((size, i) => {
      chunkRanges.push({ start: cursor, end: cursor + size - 1, worker: i + 1 });
      cursor += size;
    });

    // Re-renderizar visor con colores por worker
    renderViewer("all", document.getElementById("viewer-search-input").value);
    document.getElementById("viewer-tabs").style.display = "flex";

    renderResult(result, elapsed);

  } catch (err) {
    showError(err.message);
  } finally {
    uploadBtn.disabled    = false;
    btnText.textContent   = "Procesar archivo";
    spinner.style.display = "none";
  }
});

// ── Render resultados ──────────────────────────────────
function renderResult(result, elapsed) {
  animateNumber("stat-lines",  result.total_lines);
  animateNumber("stat-chunks", result.num_chunks);
  const ok = (result.worker_responses || []).filter(w => w.status === "ok").length;
  animateNumber("stat-workers", ok);
  document.getElementById("stat-time").textContent = elapsed + "ms";
  document.getElementById("stats-bar").style.display = "flex";

  // Workers grid
  const grid = document.getElementById("workers-grid");
  grid.innerHTML = "";
  const wcolors = ["#1E88E5","#00BCD4","#00C853","#FFB300","#AB47BC"];

  (result.worker_responses || []).forEach((w, i) => {
    const isOk  = w.status === "ok";
    const lines = isOk ? (w.data?.lines_processed ?? result.chunk_sizes?.[i] ?? "—") : "—";
    const pct   = isOk ? Math.round(((lines) / result.total_lines) * 100) : 0;
    const delay = i * 80;

    const card = document.createElement("div");
    card.className = "worker-card " + (isOk ? "success" : "error");
    card.style.animationDelay = delay + "ms";
    card.style.cursor = "pointer";
    card.title = "Ver líneas de worker " + (i+1);
    card.innerHTML = `
      <div class="worker-icon">${isOk ? "✓" : "✕"}</div>
      <div class="worker-name">worker${i + 1}</div>
      <div class="worker-lines">${lines}</div>
      <div class="worker-lines-label">líneas</div>
      <span class="worker-status ${isOk ? "ok" : "fail"}">${isOk ? "completado" : "error"}</span>
      <div class="worker-bar-bg"><div class="worker-bar-fill" id="bar-${i}"></div></div>
    `;

    // Click en worker → filtrar visor
    card.addEventListener("click", () => {
      document.querySelectorAll(".vtab").forEach(b => b.classList.remove("active"));
      const tab = document.querySelector(`.vtab[data-worker="${i+1}"]`);
      if (tab) tab.classList.add("active");
      renderViewer(String(i+1), document.getElementById("viewer-search-input").value);
      document.getElementById("viewer-section").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    grid.appendChild(card);

    setTimeout(() => {
      const bar = document.getElementById("bar-" + i);
      if (bar) bar.style.width = pct + "%";
    }, delay + 300);
  });

  document.getElementById("workers-section").style.display = "block";

  // Tabla
  const tbody = document.getElementById("results-body");
  tbody.innerHTML = "";
  let totalLines = 0;

  (result.worker_responses || []).forEach((w, i) => {
    const isOk  = w.status === "ok";
    const lines = isOk ? (w.data?.lines_processed ?? result.chunk_sizes?.[i] ?? 0) : 0;
    const start = (result.chunk_sizes || []).slice(0, i).reduce((a, b) => a + b, 0) + 1;
    const end   = start + lines - 1;
    totalLines += lines;

    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.title = "Ver líneas de worker " + (i+1);
    tr.innerHTML = `
      <td><span class="worker-pill">⬡ worker${i+1}</span></td>
      <td>${lines}</td>
      <td>líneas ${start} – ${end}</td>
      <td class="${isOk ? "status-ok" : "status-fail"}">${isOk ? "✓ Guardado en MySQL" : "✕ Error"}</td>
    `;
    tr.addEventListener("click", () => {
      document.querySelectorAll(".vtab").forEach(b => b.classList.remove("active"));
      const tab = document.querySelector(`.vtab[data-worker="${i+1}"]`);
      if (tab) tab.classList.add("active");
      renderViewer(String(i+1), "");
      document.getElementById("viewer-section").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    tbody.appendChild(tr);
  });

  document.getElementById("total-badge").textContent = totalLines + " líneas guardadas";
  document.getElementById("results-section").style.display = "block";
  if (totalLines > 0) setbadge("badge-db", "online", "⬤ MySQL");
}

// ── Helpers ────────────────────────────────────────────
function animateNumber(id, target) {
  const el = document.getElementById(id);
  let cur  = 0;
  const step = Math.max(1, Math.floor(target / 20));
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(t);
  }, 40);
}
function showError(msg) {
  document.getElementById("error-msg").textContent = msg;
  document.getElementById("error-box").style.display = "flex";
}
function hideError()   { document.getElementById("error-box").style.display = "none"; }
function hideResults() {
  ["stats-bar","workers-section","results-section"].forEach(id => {
    document.getElementById(id).style.display = "none";
  });
}
function formatBytes(b) {
  if (b < 1024) return b + " B";
  if (b < 1024*1024) return (b/1024).toFixed(1) + " KB";
  return (b/1024/1024).toFixed(2) + " MB";
}
function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

checkServices();
