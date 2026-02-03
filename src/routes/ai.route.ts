import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/storage';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  askQuestion,
  summarizeDocument,
  generateQuestions,
  evaluateAnswer,
  chat,
  searchDocuments,
  getAIUsage,
} from '../controller/ai.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/ai/documents/upload:
 *   post:
 *     summary: Upload a PDF document for AI processing
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to upload (max 10MB)
 *               title:
 *                 type: string
 *                 description: Document title
 *     responses:
 *       201:
 *         description: Document uploaded and processing started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 document:
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */
router.post('/documents/upload', upload.single('file'), uploadDocument);

/**
 * @swagger
 * /api/ai/documents:
 *   get:
 *     summary: Get all documents for the authenticated user
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 */
router.get('/documents', getDocuments);

/**
 * @swagger
 * /api/ai/documents/{id}:
 *   get:
 *     summary: Get a single document by ID
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       404:
 *         description: Document not found
 */
router.get('/documents/:id', getDocument);

/**
 * @swagger
 * /api/ai/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted
 *       404:
 *         description: Document not found
 */
router.delete('/documents/:id', deleteDocument);

/**
 * @swagger
 * /api/ai/ask:
 *   post:
 *     summary: Ask a question about your documents (RAG-based Q&A)
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: The question to ask
 *               documentId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional specific document to search
 *     responses:
 *       200:
 *         description: AI-generated answer with sources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.post('/ask', askQuestion);

/**
 * @swagger
 * /api/ai/documents/{id}/summarize:
 *   post:
 *     summary: Generate a summary of a document
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *       400:
 *         description: Document still processing
 *       404:
 *         description: Document not found
 */
router.post('/documents/:id/summarize', summarizeDocument);

/**
 * @swagger
 * /api/ai/documents/{id}/generate-questions:
 *   post:
 *     summary: Generate practice questions from a document
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               count:
 *                 type: integer
 *                 default: 5
 *                 description: Number of questions to generate
 *     responses:
 *       200:
 *         description: Generated questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.post('/documents/:id/generate-questions', generateQuestions);

/**
 * @swagger
 * /api/ai/evaluate:
 *   post:
 *     summary: Evaluate a user's answer to a question
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               documentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Evaluation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 10
 *                 feedback:
 *                   type: string
 *                 correctAnswer:
 *                   type: string
 */
router.post('/evaluate', evaluateAnswer);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: General AI chat for study assistance
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 */
router.post('/chat', chat);

/**
 * @swagger
 * /api/ai/search:
 *   post:
 *     summary: Semantic search across documents
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               documentId:
 *                 type: string
 *                 format: uuid
 *               limit:
 *                 type: integer
 *                 default: 5
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       content:
 *                         type: string
 *                       similarity:
 *                         type: number
 *                       documentId:
 *                         type: string
 */
router.post('/search', searchDocuments);

/**
 * @swagger
 * /api/ai/usage:
 *   get:
 *     summary: Get AI usage statistics for the authenticated user
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: AI usage statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIUsage'
 */
router.get('/usage', getAIUsage);

export default router;
