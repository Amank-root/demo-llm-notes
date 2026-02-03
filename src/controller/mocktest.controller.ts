import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export class MockTestController {
  // Get all mock tests
  static async getAllTests(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const subject = req.query.subject as string;
      const examType = req.query.examType as string;
      const difficulty = req.query.difficulty as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (subject) where.subject = subject;
      if (examType) where.examType = examType;
      if (difficulty) where.difficulty = difficulty;

      const [tests, total] = await Promise.all([
        prisma.mockTest.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            subject: true,
            examType: true,
            totalMarks: true,
            durationMinutes: true,
            description: true,
            difficulty: true,
            createdAt: true,
            _count: { select: { questions: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.mockTest.count({ where }),
      ]);

      res.json({
        success: true,
        data: tests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get single test with questions (for taking)
  static async getTest(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const test = await prisma.mockTest.findUnique({
        where: { id },
        include: {
          questions: {
            select: {
              id: true,
              questionText: true,
              options: true,
              topic: true,
              difficulty: true,
              marks: true,
              // Don't include correctAnswer and explanation for taking test
            },
          },
        },
      });

      if (!test) {
        return res.status(404).json({ success: false, error: 'Test not found' });
      }

      res.json({ success: true, data: test });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Submit test attempt
  static async submitTest(req: AuthRequest, res: Response) {
    try {
      const { mockTestId, answers, timeTaken } = req.body;

      if (!mockTestId || !answers) {
        return res.status(400).json({
          success: false,
          error: 'Mock test ID and answers are required',
        });
      }

      // Get test with questions
      const test = await prisma.mockTest.findUnique({
        where: { id: mockTestId },
        include: { questions: true },
      });

      if (!test) {
        return res.status(404).json({ success: false, error: 'Test not found' });
      }

      // Calculate score and weak topics
      let score = 0;
      const topicResults: Record<string, { correct: number; total: number }> = {};

      for (const question of test.questions) {
        const topic = question.topic || 'General';
        if (!topicResults[topic]) {
          topicResults[topic] = { correct: 0, total: 0 };
        }
        topicResults[topic].total++;

        const userAnswer = answers[question.id];
        if (userAnswer === question.correctAnswer) {
          score += question.marks;
          topicResults[topic].correct++;
        }
      }

      // Identify weak topics (< 60% correct)
      const weakTopics = Object.entries(topicResults)
        .filter(([_, result]) => result.correct / result.total < 0.6)
        .map(([topic, result]) => ({
          topic,
          correct: result.correct,
          total: result.total,
          percentage: Math.round((result.correct / result.total) * 100),
        }));

      // Create attempt
      const attempt = await prisma.testAttempt.create({
        data: {
          userId: req.user!.id,
          mockTestId,
          score,
          totalMarks: test.totalMarks,
          timeTaken: timeTaken || 0,
          weakTopics,
          answers,
        },
        include: {
          mockTest: { select: { title: true, subject: true } },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          attempt,
          topicResults,
          weakTopics,
          percentage: Math.round((score / test.totalMarks) * 100),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get my test attempts
  static async getMyAttempts(req: AuthRequest, res: Response) {
    try {
      const attempts = await prisma.testAttempt.findMany({
        where: { userId: req.user!.id },
        include: {
          mockTest: {
            select: { title: true, subject: true, examType: true, totalMarks: true },
          },
        },
        orderBy: { attemptedAt: 'desc' },
      });

      res.json({ success: true, data: attempts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get attempt details with answers
  static async getAttemptDetails(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const attempt = await prisma.testAttempt.findUnique({
        where: { id },
        include: {
          mockTest: {
            include: {
              questions: true, // Include correct answers for review
            },
          },
        },
      });

      if (!attempt) {
        return res.status(404).json({ success: false, error: 'Attempt not found' });
      }

      // Only allow user to view their own attempts or admin
      if (attempt.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      res.json({ success: true, data: attempt });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Create mock test
  static async createTest(req: AuthRequest, res: Response) {
    try {
      const { title, subject, examType, totalMarks, durationMinutes, description, difficulty, questions } = req.body;

      if (!title || !subject || !examType || !totalMarks || !durationMinutes) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, subject, examType, totalMarks, durationMinutes',
        });
      }

      const test = await prisma.mockTest.create({
        data: {
          title,
          subject,
          examType,
          totalMarks: parseInt(totalMarks),
          durationMinutes: parseInt(durationMinutes),
          description,
          difficulty,
          questions: questions
            ? {
                create: questions.map((q: any) => ({
                  questionText: q.questionText,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  topic: q.topic,
                  difficulty: q.difficulty,
                  explanation: q.explanation,
                  marks: q.marks || 1,
                })),
              }
            : undefined,
        },
        include: { questions: true },
      });

      res.status(201).json({ success: true, data: test });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Update mock test
  static async updateTest(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { title, subject, examType, totalMarks, durationMinutes, description, difficulty } = req.body;

      const test = await prisma.mockTest.update({
        where: { id },
        data: {
          title,
          subject,
          examType,
          totalMarks: totalMarks ? parseInt(totalMarks) : undefined,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          description,
          difficulty,
        },
      });

      res.json({ success: true, data: test });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Test not found' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Delete mock test
  static async deleteTest(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      await prisma.mockTest.delete({ where: { id } });

      res.json({ success: true, message: 'Test deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Test not found' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Add question to test
  static async addQuestion(req: AuthRequest, res: Response) {
    try {
      const { testId } = req.params;
      const { questionText, options, correctAnswer, topic, difficulty, explanation, marks } = req.body;

      if (!questionText || !options || !correctAnswer) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: questionText, options, correctAnswer',
        });
      }

      const question = await prisma.question.create({
        data: {
          mockTestId: testId as string,
        // mockTest:{
        //     connect: { id: testId as string }
        // },
          questionText,
          options,
          correctAnswer,
          topic,
          difficulty,
          explanation,
          marks: marks || 1,
        },
      });

      res.status(201).json({ success: true, data: question });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Update question
  static async updateQuestion(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const updateData = req.body;

      if (updateData.marks) updateData.marks = parseInt(updateData.marks);

      const question = await prisma.question.update({
        where: { id },
        data: updateData,
      });

      res.json({ success: true, data: question });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Delete question
  static async deleteQuestion(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      await prisma.question.delete({ where: { id } });

      res.json({ success: true, message: 'Question deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
