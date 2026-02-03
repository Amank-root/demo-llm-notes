import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { glob } from 'glob';

// Use glob to find all route files (works cross-platform)
const getRoutePaths = () => {
  const routeFiles = glob.sync('src/routes/*.ts', { cwd: process.cwd() });
  const indexFile = 'src/index.ts';
  return [...routeFiles, indexFile];
};

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Note LLM Backend API',
      version: '1.0.0',
      description: 'API documentation for the Note LLM Backend - A comprehensive learning platform with AI-powered features, notes marketplace, and mock tests.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID Token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firebaseUid: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            phone: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'SELLER', 'ADMIN'] },
            isBanned: { type: 'boolean' },
            walletBalance: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Plan: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            price: { type: 'number' },
            durationDays: { type: 'integer' },
            aiLimitPerDay: { type: 'integer' },
            mockTestLimit: { type: 'integer' },
            adsEnabled: { type: 'boolean' },
            features: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Purchase: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            planId: { type: 'string' },
            paymentTxnId: { type: 'string' },
            provider: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Note: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sellerId: { type: 'string' },
            title: { type: 'string' },
            subject: { type: 'string' },
            examType: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            fileUrl: { type: 'string' },
            thumbnailUrl: { type: 'string', nullable: true },
            previewUrl: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            downloads: { type: 'integer' },
            rating: { type: 'number' },
            ratingCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        NoteOrder: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            buyerId: { type: 'string' },
            sellerId: { type: 'string' },
            noteId: { type: 'string' },
            amount: { type: 'number' },
            platformFee: { type: 'number' },
            sellerEarning: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'IN_ESCROW', 'DISPUTED', 'REFUNDED', 'RELEASED'] },
            paymentTxnId: { type: 'string' },
            escrowReleaseAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        MockTest: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            subject: { type: 'string' },
            examType: { type: 'string' },
            difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
            duration: { type: 'integer', description: 'Duration in minutes' },
            totalMarks: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Question: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            mockTestId: { type: 'string' },
            questionText: { type: 'string' },
            options: { type: 'object' },
            correctAnswer: { type: 'string' },
            explanation: { type: 'string', nullable: true },
            marks: { type: 'integer' },
            negativeMarks: { type: 'number' },
            topic: { type: 'string', nullable: true },
          },
        },
        TestAttempt: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            mockTestId: { type: 'string' },
            score: { type: 'integer' },
            totalMarks: { type: 'integer' },
            percentage: { type: 'number' },
            correctAnswers: { type: 'integer' },
            wrongAnswers: { type: 'integer' },
            unattempted: { type: 'integer' },
            timeTaken: { type: 'integer', description: 'Time taken in seconds' },
            answers: { type: 'object' },
            weakTopics: { type: 'array', items: { type: 'string' } },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            title: { type: 'string' },
            fileName: { type: 'string' },
            fileUrl: { type: 'string' },
            fileSize: { type: 'integer' },
            mimeType: { type: 'string' },
            pageCount: { type: 'integer' },
            status: { type: 'string', enum: ['processing', 'ready', 'failed'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AIUsage: {
          type: 'object',
          properties: {
            totalRequests: { type: 'integer' },
            usageByFeature: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  featureType: { type: 'string' },
                  _count: { type: 'integer' },
                  _sum: {
                    type: 'object',
                    properties: {
                      inputTokens: { type: 'integer' },
                      outputTokens: { type: 'integer' },
                    },
                  },
                },
              },
            },
            recentRequests: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Plans', description: 'Subscription plan management' },
      { name: 'Users', description: 'User profile and management' },
      { name: 'Purchases', description: 'Plan purchase and subscription' },
      { name: 'Notes', description: 'Notes marketplace' },
      { name: 'Orders', description: 'Note orders and escrow' },
      { name: 'Mock Tests', description: 'Mock test management' },
      { name: 'Analytics', description: 'Admin analytics and dashboard' },
      { name: 'AI', description: 'AI-powered features' },
    ],
  },
  apis: getRoutePaths(),
};

console.log('Swagger scanning files:', getRoutePaths());

export const swaggerSpec = swaggerJsdoc(options);
