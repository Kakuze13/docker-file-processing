-- Tabla de archivos
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    total_chunks INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de chunks
CREATE TABLE IF NOT EXISTS chunks (
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    chunk_id INT NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (file_id, chunk_id)
);
