-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_embeddings table with vector column
CREATE TABLE IF NOT EXISTS document_embeddings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chunk_id TEXT NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search (using HNSW - more efficient than IVFFlat)
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector 
ON document_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Create index for filtering by user
CREATE INDEX IF NOT EXISTS idx_document_embeddings_user_id 
ON document_embeddings(user_id);

-- Create index for filtering by document
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id 
ON document_embeddings(document_id);
