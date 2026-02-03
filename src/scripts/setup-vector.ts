import "dotenv/config";
import prisma from '../config/db';

async function setupVectorEmbeddings() {
  console.log('Setting up pgvector extension and embeddings table...');

  try {
    // Enable pgvector extension
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log('✅ pgvector extension enabled');

    // Create document_embeddings table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        chunk_id TEXT NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        embedding vector(1536) NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ document_embeddings table created');

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector 
      ON document_embeddings 
      USING hnsw (embedding vector_cosine_ops);
    `);
    console.log('✅ Vector similarity index created');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_document_embeddings_user_id 
      ON document_embeddings(user_id);
    `);
    console.log('✅ User ID index created');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id 
      ON document_embeddings(document_id);
    `);
    console.log('✅ Document ID index created');

    console.log('\n🎉 Vector embeddings setup complete!');
  } catch (error) {
    console.error('Error setting up vector embeddings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupVectorEmbeddings();
