const API_URL = "http://localhost:5000";

document.getElementById("upload-btn").addEventListener("click", async () => {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  if (!file) return alert("Selecciona un archivo primero.");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  console.log("Upload result:", result);
  loadFiles();
});

async function loadFiles() {
  const response = await fetch(`${API_URL}/files`);
  const files = await response.json();

  const list = document.getElementById("file-list");
  list.innerHTML = "";

  files.forEach((f) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${API_URL}/download/${f.id}" download="${f.name}">${f.name}</a>`;
    list.appendChild(li);
  });
}

loadFiles();
