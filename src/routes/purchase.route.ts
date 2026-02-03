import { Router } from 'express';
import { PurchaseController } from '../controller/purchase.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All purchase routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Create a new plan purchase
 *     tags: [Purchases]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - paymentTxnId
 *               - provider
 *             properties:
 *               planId:
 *                 type: string
 *                 format: uuid
 *               paymentTxnId:
 *                 type: string
 *               provider:
 *                 type: string
 *                 example: razorpay
 *     responses:
 *       201:
 *         description: Purchase created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Purchase'
 *       400:
 *         description: Invalid request
 */
router.post('/', PurchaseController.createPurchase);

/**
 * @swagger
 * /api/purchases/confirm:
 *   post:
 *     summary: Confirm payment for a purchase
 *     tags: [Purchases]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseId
 *             properties:
 *               purchaseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Payment confirmed, subscription activated
 *       404:
 *         description: Purchase not found
 */
router.post('/confirm', PurchaseController.confirmPayment);

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Get all purchases (Admin only)
 *     tags: [Purchases]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, FAILED, REFUNDED]
 *     responses:
 *       200:
 *         description: List of purchases
 *       403:
 *         description: Admin access required
 */
router.get('/', requireAdmin, PurchaseController.getAllPurchases);

/**
 * @swagger
 * /api/purchases/{id}/refund:
 *   post:
 *     summary: Refund a purchase (Admin only)
 *     tags: [Purchases]
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
 *         description: Purchase refunded
 *       404:
 *         description: Purchase not found
 */
router.post('/:id/refund', requireAdmin, PurchaseController.refundPurchase);

export default router;
