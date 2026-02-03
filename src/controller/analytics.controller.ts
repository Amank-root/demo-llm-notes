import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export class AnalyticsController {
  // Get dashboard overview
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get counts
      const [
        totalUsers,
        newUsersToday,
        newUsersMonth,
        totalNotes,
        pendingNotes,
        totalTests,
        totalOrders,
        pendingDisputes,
        revenue,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.note.count({ where: { approved: true } }),
        prisma.note.count({ where: { approved: false } }),
        prisma.mockTest.count(),
        prisma.noteOrder.count(),
        prisma.dispute.count({ where: { status: 'OPEN' } }),
        prisma.noteOrder.aggregate({
          _sum: { commissionAmount: true },
          where: { escrowStatus: 'RELEASED' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            newToday: newUsersToday,
            newThisMonth: newUsersMonth,
          },
          notes: {
            total: totalNotes,
            pending: pendingNotes,
          },
          tests: {
            total: totalTests,
          },
          orders: {
            total: totalOrders,
            pendingDisputes,
          },
          revenue: {
            platformCommission: revenue._sum.commissionAmount || 0,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get daily metrics
  static async getDailyMetrics(req: AuthRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const metrics = await prisma.dailyMetric.findMany({
        where: { date: { gte: fromDate } },
        orderBy: { date: 'asc' },
      });

      res.json({ success: true, data: metrics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Record daily metrics (cron job endpoint)
  static async recordDailyMetrics(req: AuthRequest, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Calculate metrics for yesterday
      const [
        newUsers,
        activeUsers,
        purchases,
        revenueData,
        notesDownloads,
        testsAttempted,
      ] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: { gte: yesterday, lt: today },
          },
        }),
        // Active users = users who made a test attempt or purchase yesterday
        prisma.user.count({
          where: {
            OR: [
              { testAttempts: { some: { attemptedAt: { gte: yesterday, lt: today } } } },
              { notesPurchased: { some: { createdAt: { gte: yesterday, lt: today } } } },
            ],
          },
        }),
        prisma.purchase.count({
          where: {
            createdAt: { gte: yesterday, lt: today },
            status: 'COMPLETED',
          },
        }),
        prisma.purchase.aggregate({
          _sum: { amount: true },
          where: {
            createdAt: { gte: yesterday, lt: today },
            status: 'COMPLETED',
          },
        }),
        prisma.noteOrder.count({
          where: { createdAt: { gte: yesterday, lt: today } },
        }),
        prisma.testAttempt.count({
          where: { attemptedAt: { gte: yesterday, lt: today } },
        }),
      ]);

      // Upsert daily metric
      const metric = await prisma.dailyMetric.upsert({
        where: { date: yesterday },
        update: {
          newUsers,
          activeUsers,
          purchases,
          revenue: revenueData._sum.amount || 0,
          notesDownloads,
          testsAttempted,
        },
        create: {
          date: yesterday,
          newUsers,
          activeUsers,
          purchases,
          revenue: revenueData._sum.amount || 0,
          notesDownloads,
          testsAttempted,
        },
      });

      res.json({ success: true, data: metric });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get user growth chart data
  static async getUserGrowth(req: AuthRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      
      const result: { date: string; count: number }[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await prisma.user.count({
          where: {
            createdAt: { gte: date, lt: nextDate },
          },
        });
        
        result.push({
          date: date.toISOString().split('T')[0],
          count,
        });
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get revenue chart data
  static async getRevenueChart(req: AuthRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      
      const result: { date: string; revenue: number; orders: number }[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const [purchaseRevenue, orderCount] = await Promise.all([
          prisma.purchase.aggregate({
            _sum: { amount: true },
            where: {
              createdAt: { gte: date, lt: nextDate },
              status: 'COMPLETED',
            },
          }),
          prisma.noteOrder.count({
            where: { createdAt: { gte: date, lt: nextDate } },
          }),
        ]);
        
        result.push({
          date: date.toISOString().split('T')[0],
          revenue: purchaseRevenue._sum.amount || 0,
          orders: orderCount,
        });
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get top sellers
  static async getTopSellers(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const sellers = await prisma.sellerWallet.findMany({
        take: limit,
        orderBy: { balance: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              _count: { select: { notesCreated: true } },
            },
          },
        },
      });

      res.json({ success: true, data: sellers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get popular notes
  static async getPopularNotes(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const notes = await prisma.note.findMany({
        take: limit,
        where: { approved: true },
        orderBy: { downloads: 'desc' },
        include: {
          seller: { select: { id: true, name: true } },
        },
      });

      res.json({ success: true, data: notes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get plan distribution
  static async getPlanDistribution(req: AuthRequest, res: Response) {
    try {
      const distribution = await prisma.user.groupBy({
        by: ['planType'],
        _count: { planType: true },
      });

      res.json({ success: true, data: distribution });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
