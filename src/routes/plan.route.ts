import { Router } from 'express';
import { PlanController } from '../controller/plan.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Get all active subscription plans
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: List of plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plan'
 */
router.get('/', PlanController.getAllPlans);

/**
 * @swagger
 * /api/plans/{id}:
 *   get:
 *     summary: Get a single plan by ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plan details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plan'
 *       404:
 *         description: Plan not found
 */
router.get('/:id', PlanController.getPlan);

/**
 * @swagger
 * /api/plans:
 *   post:
 *     summary: Create a new plan (Admin only)
 *     tags: [Plans]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - durationDays
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               durationDays:
 *                 type: integer
 *               aiLimitPerDay:
 *                 type: integer
 *               mockTestLimit:
 *                 type: integer
 *               adsEnabled:
 *                 type: boolean
 *               features:
 *                 type: object
 *     responses:
 *       201:
 *         description: Plan created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', authenticate, requireAdmin, PlanController.createPlan);

/**
 * @swagger
 * /api/plans/{id}:
 *   put:
 *     summary: Update a plan (Admin only)
 *     tags: [Plans]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               durationDays:
 *                 type: integer
 *               aiLimitPerDay:
 *                 type: integer
 *               mockTestLimit:
 *                 type: integer
 *               adsEnabled:
 *                 type: boolean
 *               features:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plan updated
 *       404:
 *         description: Plan not found
 */
router.put('/:id', authenticate, requireAdmin, PlanController.updatePlan);

/**
 * @swagger
 * /api/plans/{id}:
 *   delete:
 *     summary: Delete a plan (Admin only)
 *     tags: [Plans]
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
 *         description: Plan deleted
 *       404:
 *         description: Plan not found
 */
router.delete('/:id', authenticate, requireAdmin, PlanController.deletePlan);

export default router;
