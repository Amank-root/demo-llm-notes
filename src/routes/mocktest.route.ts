import { Router } from 'express';
import { MockTestController } from '../controller/mocktest.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/tests/submit:
 *   post:
 *     summary: Submit a mock test attempt
 *     tags: [Mock Tests]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mockTestId
 *               - answers
 *               - timeTaken
 *             properties:
 *               mockTestId:
 *                 type: string
 *                 format: uuid
 *               answers:
 *                 type: object
 *                 description: Map of questionId to answer
 *                 example: {"q1": "A", "q2": "B"}
 *               timeTaken:
 *                 type: integer
 *                 description: Time taken in seconds
 *     responses:
 *       201:
 *         description: Test submitted and scored
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestAttempt'
 */
router.post('/submit', authenticate, MockTestController.submitTest);

/**
 * @swagger
 * /api/tests/attempts/my:
 *   get:
 *     summary: Get test attempts by the authenticated user
 *     tags: [Mock Tests]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of test attempts
 */
router.get('/attempts/my', authenticate, MockTestController.getMyAttempts);

/**
 * @swagger
 * /api/tests/attempts/{id}:
 *   get:
 *     summary: Get details of a specific test attempt
 *     tags: [Mock Tests]
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
 *         description: Test attempt details with answers
 *       404:
 *         description: Attempt not found
 */
router.get('/attempts/:id', authenticate, MockTestController.getAttemptDetails);

/**
 * @swagger
 * /api/tests/questions/{id}:
 *   put:
 *     summary: Update a question (Admin only)
 *     tags: [Mock Tests]
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
 *               questionText:
 *                 type: string
 *               options:
 *                 type: object
 *               correctAnswer:
 *                 type: string
 *               explanation:
 *                 type: string
 *               marks:
 *                 type: integer
 *               negativeMarks:
 *                 type: number
 *               topic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Question updated
 */
router.put('/questions/:id', authenticate, requireAdmin, MockTestController.updateQuestion);

/**
 * @swagger
 * /api/tests/questions/{id}:
 *   delete:
 *     summary: Delete a question (Admin only)
 *     tags: [Mock Tests]
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
 *         description: Question deleted
 */
router.delete('/questions/:id', authenticate, requireAdmin, MockTestController.deleteQuestion);

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Get all mock tests (Public)
 *     tags: [Mock Tests]
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: examType
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *     responses:
 *       200:
 *         description: List of mock tests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MockTest'
 */
router.get('/', MockTestController.getAllTests);

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get a mock test with questions
 *     tags: [Mock Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Mock test with questions
 *       404:
 *         description: Test not found
 */
router.get('/:id', MockTestController.getTest);

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new mock test (Admin only)
 *     tags: [Mock Tests]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - subject
 *               - examType
 *               - difficulty
 *               - duration
 *               - totalMarks
 *             properties:
 *               title:
 *                 type: string
 *               subject:
 *                 type: string
 *               examType:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               totalMarks:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Mock test created
 */
router.post('/', authenticate, requireAdmin, MockTestController.createTest);

/**
 * @swagger
 * /api/tests/{id}:
 *   put:
 *     summary: Update a mock test (Admin only)
 *     tags: [Mock Tests]
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
 *               title:
 *                 type: string
 *               subject:
 *                 type: string
 *               duration:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Mock test updated
 */
router.put('/:id', authenticate, requireAdmin, MockTestController.updateTest);

/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Delete a mock test (Admin only)
 *     tags: [Mock Tests]
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
 *         description: Mock test deleted
 */
router.delete('/:id', authenticate, requireAdmin, MockTestController.deleteTest);

/**
 * @swagger
 * /api/tests/{testId}/questions:
 *   post:
 *     summary: Add a question to a mock test (Admin only)
 *     tags: [Mock Tests]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionText
 *               - options
 *               - correctAnswer
 *               - marks
 *             properties:
 *               questionText:
 *                 type: string
 *               options:
 *                 type: object
 *                 example: {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}
 *               correctAnswer:
 *                 type: string
 *                 example: A
 *               explanation:
 *                 type: string
 *               marks:
 *                 type: integer
 *               negativeMarks:
 *                 type: number
 *                 default: 0
 *               topic:
 *                 type: string
 *     responses:
 *       201:
 *         description: Question added
 */
router.post('/:testId/questions', authenticate, requireAdmin, MockTestController.addQuestion);

export default router;
