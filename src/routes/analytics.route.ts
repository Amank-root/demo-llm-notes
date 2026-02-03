import { Router } from 'express';
import { AnalyticsController } from '../controller/analytics.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All analytics routes require admin
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get admin dashboard overview
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalNotes:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *                 activeSubscriptions:
 *                   type: integer
 *                 pendingApprovals:
 *                   type: integer
 *                 recentActivity:
 *                   type: array
 *       403:
 *         description: Admin access required
 */
router.get('/dashboard', AnalyticsController.getDashboard);

/**
 * @swagger
 * /api/analytics/metrics:
 *   get:
 *     summary: Get daily metrics history
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to fetch
 *     responses:
 *       200:
 *         description: Daily metrics data
 */
router.get('/metrics', AnalyticsController.getDailyMetrics);

/**
 * @swagger
 * /api/analytics/metrics/record:
 *   post:
 *     summary: Record daily metrics (Cron job)
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Metrics recorded
 */
router.post('/metrics/record', AnalyticsController.recordDailyMetrics);

/**
 * @swagger
 * /api/analytics/charts/user-growth:
 *   get:
 *     summary: Get user growth chart data
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: User growth data by day
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                   count:
 *                     type: integer
 */
router.get('/charts/user-growth', AnalyticsController.getUserGrowth);

/**
 * @swagger
 * /api/analytics/charts/revenue:
 *   get:
 *     summary: Get revenue chart data
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Revenue data by day
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                   revenue:
 *                     type: number
 */
router.get('/charts/revenue', AnalyticsController.getRevenueChart);

/**
 * @swagger
 * /api/analytics/top-sellers:
 *   get:
 *     summary: Get top note sellers
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top sellers leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   seller:
 *                     $ref: '#/components/schemas/User'
 *                   totalSales:
 *                     type: integer
 *                   totalEarnings:
 *                     type: number
 */
router.get('/top-sellers', AnalyticsController.getTopSellers);

/**
 * @swagger
 * /api/analytics/popular-notes:
 *   get:
 *     summary: Get most popular notes
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Most downloaded/purchased notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 */
router.get('/popular-notes', AnalyticsController.getPopularNotes);

/**
 * @swagger
 * /api/analytics/plan-distribution:
 *   get:
 *     summary: Get subscription plan distribution
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User distribution across plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   planType:
 *                     type: string
 *                   count:
 *                     type: integer
 *                   percentage:
 *                     type: number
 */
router.get('/plan-distribution', AnalyticsController.getPlanDistribution);

export default router;
