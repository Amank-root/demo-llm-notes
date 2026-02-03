import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import { AIService } from '../services/ai.service';
import { getFileUrl, deleteFile } from '../config/storage';
import fs from 'fs';

// Upload and process PDF document
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const file = req.file;
    const { title } = req.body;

    // Read file buffer
    const buffer = fs.readFileSync(file.path);

    // Extract text and page count from PDF
    const { text, pageCount } = await AIService.extractTextFromPDF(buffer);

    // Create document record
    const document = await prisma.document.create({
      data: {
        userId,
        title: title || file.originalname,
        fileName: file.originalname,
        fileUrl: getFileUrl(file.filename),
        fileSize: file.size,
        mimeType: file.mimetype,
        pageCount,
        status: 'processing',
      },
    });

    // Process document in background (create embeddings)
    AIService.processDocument(document.id, text, userId).catch((error) => {
      console.error('Background processing error:', error);
    });

    res.status(201).json({
      message: 'Document uploaded and processing started',
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        pageCount: document.pageCount,
        status: document.status,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

// Get all documents for user
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
};

// Get single document
export const getDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.id as string;

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
};

// Delete document
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.id as string;

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Delete embeddings first
    await prisma.$executeRaw`
      DELETE FROM document_embeddings WHERE document_id = ${documentId}
    `;

    // Delete chunks
    await prisma.documentChunk.deleteMany({
      where: { documentId },
    });

    // Delete document
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Delete file from storage
    const filename = document.fileUrl.split('/').pop();
    if (filename) {
      await deleteFile(filename);
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

// Ask question about documents (RAG)
export const askQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { question, documentId } = req.body;

    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const result = await AIService.askQuestion(question, userId, documentId);

    res.json(result);
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
};

// Summarize document
export const summarizeDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.id as string;

    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    if (document.status !== 'ready') {
      res.status(400).json({ error: 'Document is still processing' });
      return;
    }

    const summary = await AIService.summarizeDocument(documentId, userId);

    res.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to summarize document' });
  }
};

// Generate practice questions from document
export const generateQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.id as string;
    const { count = 5 } = req.body;

    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    if (document.status !== 'ready') {
      res.status(400).json({ error: 'Document is still processing' });
      return;
    }

    const result = await AIService.generateQuestions(documentId, userId, count);

    res.json(result);
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
};

// Evaluate answer
export const evaluateAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { question, answer, documentId } = req.body;

    if (!question || !answer) {
      res.status(400).json({ error: 'Question and answer are required' });
      return;
    }

    const result = await AIService.evaluateAnswer(question, answer, userId, documentId);

    res.json(result);
  } catch (error) {
    console.error('Evaluate answer error:', error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
};

// General chat
export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { message, history = [] } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const response = await AIService.chat(message, userId, history);

    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
};

// Search across documents
export const searchDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { query, documentId, limit = 5 } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const results = await AIService.searchSimilarChunks(query, userId, documentId, limit);

    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
};

// Get AI usage stats
export const getAIUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const usage = await prisma.aIRequest.groupBy({
      by: ['featureType'],
      where: { userId },
      _count: true,
      _sum: {
        inputTokens: true,
        outputTokens: true,
      },
    });

    const totalRequests = await prisma.aIRequest.count({
      where: { userId },
    });

    const recentRequests = await prisma.aIRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      totalRequests,
      usageByFeature: usage,
      recentRequests,
    });
  } catch (error) {
    console.error('Get AI usage error:', error);
    res.status(500).json({ error: 'Failed to get AI usage' });
  }
};
