import { Router } from 'express';
import { OrderController } from '../controller/order.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/orders/purchase:
 *   post:
 *     summary: Purchase a note
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - noteId
 *               - paymentTxnId
 *             properties:
 *               noteId:
 *                 type: string
 *                 format: uuid
 *               paymentTxnId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note purchased, in escrow
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoteOrder'
 *       400:
 *         description: Already purchased or invalid note
 */
router.post('/purchase', OrderController.purchaseNote);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Get orders made by the authenticated user
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/my-orders', OrderController.getMyOrders);

/**
 * @swagger
 * /api/orders/dispute:
 *   post:
 *     summary: Create a dispute for an order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - reason
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dispute created
 *       400:
 *         description: Cannot dispute this order
 */
router.post('/dispute', OrderController.createDispute);

/**
 * @swagger
 * /api/orders/my-disputes:
 *   get:
 *     summary: Get disputes filed by the authenticated user
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of disputes
 */
router.get('/my-disputes', OrderController.getMyDisputes);

/**
 * @swagger
 * /api/orders/my-sales:
 *   get:
 *     summary: Get sales made by the authenticated seller
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales
 */
router.get('/my-sales', OrderController.getMySales);

/**
 * @swagger
 * /api/orders/wallet:
 *   get:
 *     summary: Get wallet balance and transaction history
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                 pendingEarnings:
 *                   type: number
 *                 totalEarnings:
 *                   type: number
 *                 recentTransactions:
 *                   type: array
 */
router.get('/wallet', OrderController.getWallet);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, IN_ESCROW, DISPUTED, REFUNDED, RELEASED]
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
 *     responses:
 *       200:
 *         description: List of all orders
 *       403:
 *         description: Admin access required
 */
router.get('/', requireAdmin, OrderController.getAllOrders);

/**
 * @swagger
 * /api/orders/{id}/release:
 *   post:
 *     summary: Release escrow for an order (Admin only)
 *     tags: [Orders]
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
 *         description: Escrow released, seller paid
 *       404:
 *         description: Order not found
 */
router.post('/:id/release', requireAdmin, OrderController.releaseEscrow);

/**
 * @swagger
 * /api/orders/{id}/refund:
 *   post:
 *     summary: Refund an order (Admin only)
 *     tags: [Orders]
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
 *         description: Order refunded
 *       404:
 *         description: Order not found
 */
router.post('/:id/refund', requireAdmin, OrderController.refundOrder);

/**
 * @swagger
 * /api/orders/disputes/all:
 *   get:
 *     summary: Get all disputes (Admin only)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all disputes
 *       403:
 *         description: Admin access required
 */
router.get('/disputes/all', requireAdmin, OrderController.getAllDisputes);

/**
 * @swagger
 * /api/orders/disputes/{id}/resolve:
 *   patch:
 *     summary: Resolve a dispute (Admin only)
 *     tags: [Orders]
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
 *             required:
 *               - resolution
 *               - action
 *             properties:
 *               resolution:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [REFUND, RELEASE]
 *     responses:
 *       200:
 *         description: Dispute resolved
 */
router.patch('/disputes/:id/resolve', requireAdmin, OrderController.resolveDispute);

/**
 * @swagger
 * /api/orders/cron/release-escrow:
 *   post:
 *     summary: Process automatic escrow releases (Admin/Cron)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Escrow releases processed
 */
router.post('/cron/release-escrow', requireAdmin, OrderController.processEscrowRelease);

export default router;
