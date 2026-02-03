import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { extractText } from 'unpdf';
import prisma from '../config/db';
import { AIFeatureType } from '../generated/prisma/client';

// Initialize OpenAI models
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
});

const embeddingsModel = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',
});

// Text splitter for chunking documents
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', ''],
});

export class AIService {
  // Extract text from PDF buffer
  static async extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
    try {
      // Convert buffer to Uint8Array for unpdf
      const uint8Array = new Uint8Array(buffer);
      
      // Extract text using unpdf
      const result = await extractText(uint8Array);
      
      // unpdf returns text as an array of strings (one per page)
      const fullText = Array.isArray(result.text) 
        ? result.text.join('\n\n') 
        : String(result.text);
      
      return {
        text: fullText,
        pageCount: result.totalPages,
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // Generate embeddings for text
  static async generateEmbedding(text: string): Promise<number[]> {
    const embedding = await embeddingsModel.embedQuery(text);
    return embedding;
  }

  // Create embeddings for a document and store in database
  static async processDocument(
    documentId: string,
    text: string,
    userId: string
  ): Promise<void> {
    try {
      // Split text into chunks
      const chunks = await textSplitter.splitText(text);

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.generateEmbedding(chunk);

        // Create document chunk
        const documentChunk = await prisma.documentChunk.create({
          data: {
            documentId,
            content: chunk,
            chunkIndex: i,
            tokenCount: Math.ceil(chunk.length / 4), // Approximate token count
          },
        });

        // Store embedding using raw SQL (pgvector)
        await prisma.$executeRaw`
          INSERT INTO document_embeddings (id, chunk_id, document_id, user_id, embedding, created_at)
          VALUES (
            gen_random_uuid(),
            ${documentChunk.id},
            ${documentId},
            ${userId},
            ${embedding}::vector,
            NOW()
          )
        `;
      }

      // Update document status to ready
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'ready' },
      });
    } catch (error) {
      console.error('Document processing error:', error);
      // Update document status to failed
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  // Search similar chunks using vector similarity
  static async searchSimilarChunks(
    query: string,
    userId: string,
    documentId?: string,
    limit: number = 5
  ): Promise<{ content: string; similarity: number; documentId: string }[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    let results;
    if (documentId) {
      results = await prisma.$queryRaw<any[]>`
        SELECT 
          dc.content,
          de.document_id,
          1 - (de.embedding <=> ${queryEmbedding}::vector) as similarity
        FROM document_embeddings de
        JOIN document_chunks dc ON dc.id = de.chunk_id
        WHERE de.user_id = ${userId} AND de.document_id = ${documentId}
        ORDER BY de.embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;
    } else {
      results = await prisma.$queryRaw<any[]>`
        SELECT 
          dc.content,
          de.document_id,
          1 - (de.embedding <=> ${queryEmbedding}::vector) as similarity
        FROM document_embeddings de
        JOIN document_chunks dc ON dc.id = de.chunk_id
        WHERE de.user_id = ${userId}
        ORDER BY de.embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;
    }

    return results;
  }

  // RAG-based question answering
  static async askQuestion(
    question: string,
    userId: string,
    documentId?: string
  ): Promise<{ answer: string; sources: string[] }> {
    // Get relevant context
    const relevantChunks = await this.searchSimilarChunks(question, userId, documentId, 5);

    if (relevantChunks.length === 0) {
      return {
        answer: 'No relevant information found in your documents. Please upload documents first.',
        sources: [],
      };
    }

    const context = relevantChunks.map((chunk) => chunk.content).join('\n\n---\n\n');

    // Create prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful study assistant. Answer the question based on the provided context from the user's documents.
If you cannot find the answer in the context, say so honestly.

Context:
{context}

Question: {question}

Provide a clear, helpful answer. If referencing specific information from the context, be accurate.
`);

    // Create chain
    const chain = RunnableSequence.from([
      promptTemplate,
      chatModel,
      new StringOutputParser(),
    ]);

    const answer = await chain.invoke({
      context,
      question,
    });

    // Log AI request
    await prisma.aIRequest.create({
      data: {
        userId,
        featureType: AIFeatureType.DOUBT_SOLVING,
        model: 'gpt-4o-mini',
        inputTokens: Math.ceil((context.length + question.length) / 4),
        outputTokens: Math.ceil(answer.length / 4),
      },
    });

    return {
      answer,
      sources: relevantChunks.map((c) => c.content.substring(0, 100) + '...'),
    };
  }

  // Generate summary of a document
  static async summarizeDocument(documentId: string, userId: string): Promise<string> {
    // Get all chunks of the document
    const chunks = await prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' },
      take: 10, // Limit to first 10 chunks for summary
    });

    if (chunks.length === 0) {
      throw new Error('No content found in document');
    }

    const content = chunks.map((c) => c.content).join('\n\n');

    const promptTemplate = PromptTemplate.fromTemplate(`
Summarize the following document content. Provide:
1. A brief overview (2-3 sentences)
2. Key topics covered
3. Main takeaways

Document Content:
{content}
`);

    const chain = RunnableSequence.from([
      promptTemplate,
      chatModel,
      new StringOutputParser(),
    ]);

    const summary = await chain.invoke({ content });

    // Log AI request
    await prisma.aIRequest.create({
      data: {
        userId,
        featureType: AIFeatureType.SUMMARY,
        model: 'gpt-4o-mini',
        inputTokens: Math.ceil(content.length / 4),
        outputTokens: Math.ceil(summary.length / 4),
      },
    });

    return summary;
  }

  // Generate questions from document
  static async generateQuestions(
    documentId: string,
    userId: string,
    count: number = 5
  ): Promise<{ questions: string[] }> {
    const chunks = await prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' },
      take: 5,
    });

    if (chunks.length === 0) {
      throw new Error('No content found in document');
    }

    const content = chunks.map((c) => c.content).join('\n\n');

    const promptTemplate = PromptTemplate.fromTemplate(`
Based on the following study material, generate {count} practice questions that test understanding of the key concepts.
Include a mix of:
- Conceptual questions
- Application-based questions
- Short answer questions

Content:
{content}

Generate exactly {count} questions, numbered 1 to {count}.
`);

    const chain = RunnableSequence.from([
      promptTemplate,
      chatModel,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({ content, count: count.toString() });

    // Parse questions from result
    const questions = result
      .split(/\d+\.\s+/)
      .filter((q) => q.trim().length > 0)
      .map((q) => q.trim());

    // Log AI request
    await prisma.aIRequest.create({
      data: {
        userId,
        featureType: AIFeatureType.QUESTION_GENERATION,
        model: 'gpt-4o-mini',
        inputTokens: Math.ceil(content.length / 4),
        outputTokens: Math.ceil(result.length / 4),
      },
    });

    return { questions };
  }

  // Evaluate answer
  static async evaluateAnswer(
    question: string,
    userAnswer: string,
    userId: string,
    documentId?: string
  ): Promise<{ score: number; feedback: string; correctAnswer?: string }> {
    // Get relevant context if documentId provided
    let context = '';
    if (documentId) {
      const chunks = await this.searchSimilarChunks(question, userId, documentId, 3);
      context = chunks.map((c) => c.content).join('\n\n');
    }

    const promptTemplate = PromptTemplate.fromTemplate(`
You are an examiner evaluating a student's answer.

Question: {question}

Student's Answer: {userAnswer}

${context ? `Reference Material:\n{context}\n` : ''}

Evaluate the answer and provide:
1. Score out of 10
2. Detailed feedback on what was correct and what was missing
3. A model answer (if the student's answer was incomplete)

Format your response as:
SCORE: [number]
FEEDBACK: [your feedback]
MODEL_ANSWER: [model answer if needed]
`);

    const chain = RunnableSequence.from([
      promptTemplate,
      chatModel,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      question,
      userAnswer,
      context,
    });

    // Parse the result
    const scoreMatch = result.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = result.match(/FEEDBACK:\s*([\s\S]*?)(?=MODEL_ANSWER:|$)/i);
    const modelAnswerMatch = result.match(/MODEL_ANSWER:\s*([\s\S]*?)$/i);

    // Log AI request
    await prisma.aIRequest.create({
      data: {
        userId,
        featureType: AIFeatureType.ANSWER_EVALUATION,
        model: 'gpt-4o-mini',
        inputTokens: Math.ceil((question.length + userAnswer.length + context.length) / 4),
        outputTokens: Math.ceil(result.length / 4),
      },
    });

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
      feedback: feedbackMatch ? feedbackMatch[1].trim() : result,
      correctAnswer: modelAnswerMatch ? modelAnswerMatch[1].trim() : undefined,
    };
  }

  // General chat with AI
  static async chat(
    message: string,
    userId: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<string> {
    const systemPrompt = `You are a helpful study assistant. You help students with:
- Understanding concepts
- Solving problems
- Providing study tips
- Career guidance
- Exam preparation strategies

Be friendly, encouraging, and educational in your responses.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: message },
    ];

    const response = await chatModel.invoke(messages);

    // Log AI request
    await prisma.aIRequest.create({
      data: {
        userId,
        featureType: AIFeatureType.DOUBT_SOLVING,
        model: 'gpt-4o-mini',
        inputTokens: Math.ceil(message.length / 4),
        outputTokens: Math.ceil(String(response.content).length / 4),
      },
    });

    return String(response.content);
  }
}
