import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export class UserController {
  // Get current user details
  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          profile: true,
          wallet: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update user basic info
  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { name },
      });

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get or create user profile
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      let profile = await prisma.userProfile.findUnique({
        where: { userId: req.user!.id },
      });

      if (!profile) {
        profile = await prisma.userProfile.create({
          data: { userId: req.user!.id },
        });
      }

      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update user profile
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { classLevel, interests, examCategory, dailyStudyHours, language } = req.body;

      const profile = await prisma.userProfile.upsert({
        where: { userId: req.user!.id },
        update: {
          classLevel,
          interests,
          examCategory,
          dailyStudyHours: dailyStudyHours ? parseInt(dailyStudyHours) : undefined,
          language,
        },
        create: {
          userId: req.user!.id,
          classLevel,
          interests,
          examCategory,
          dailyStudyHours: dailyStudyHours ? parseInt(dailyStudyHours) : undefined,
          language,
        },
      });

      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get user's active subscription
  static async getActiveSubscription(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      
      const activePurchase = await prisma.purchase.findFirst({
        where: {
          userId: req.user!.id,
          status: 'COMPLETED',
          endDate: { gte: now },
        },
        include: {
          plan: true,
        },
        orderBy: { endDate: 'desc' },
      });

      res.json({ success: true, data: activePurchase });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get user's purchase history
  static async getPurchaseHistory(req: AuthRequest, res: Response) {
    try {
      const purchases = await prisma.purchase.findMany({
        where: { userId: req.user!.id },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: purchases });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Get all users
  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          include: { profile: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);

      res.json({
        success: true,
        data: users,
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

  // Admin: Get user by ID
  static async getUserById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id:id as string },
        include: {
          profile: true,
          purchases: { include: { plan: true } },
          wallet: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Ban/Unban user
  static async toggleBanUser(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { isBanned } = req.body;

      const user = await prisma.user.update({
        where: { id:id as string },
        data: { isBanned },
      });

      res.json({
        success: true,
        message: isBanned ? 'User banned successfully' : 'User unbanned successfully',
        data: user,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Update user role
  static async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      if (!['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role' });
      }

      const user = await prisma.user.update({
        where: { id:id as string },
        data: { role },
      });

      res.json({ success: true, data: user });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
