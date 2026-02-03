import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export class PlanController {
  // Get all plans
  static async getAllPlans(req: AuthRequest, res: Response) {
    try {
      const plans = await prisma.plan.findMany({
        orderBy: { price: 'asc' },
      });
      
      res.json({ success: true, data: plans });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get single plan
  static async getPlan(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      
      const plan = await prisma.plan.findUnique({
        where: { id:id as string },
      });

      if (!plan) {
        return res.status(404).json({ success: false, error: 'Plan not found' });
      }

      res.json({ success: true, data: plan });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Create plan (admin only)
  static async createPlan(req: AuthRequest, res: Response) {
    try {
      const {
        name,
        price,
        durationDays,
        aiLimitPerDay,
        mockTestLimit,
        adsEnabled,
        features,
      } = req.body;

      if (!name || price === undefined || !durationDays || !aiLimitPerDay || !mockTestLimit) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, price, durationDays, aiLimitPerDay, mockTestLimit',
        });
      }

      const plan = await prisma.plan.create({
        data: {
          name,
          price: parseFloat(price),
          durationDays: parseInt(durationDays),
          aiLimitPerDay: parseInt(aiLimitPerDay),
          mockTestLimit: parseInt(mockTestLimit),
          adsEnabled: adsEnabled !== undefined ? adsEnabled : true,
          features: features || null,
        },
      });

      res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update plan (admin only)
  static async updatePlan(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const updateData = req.body;

      // Convert numeric fields if present
      if (updateData.price) updateData.price = parseFloat(updateData.price);
      if (updateData.durationDays) updateData.durationDays = parseInt(updateData.durationDays);
      if (updateData.aiLimitPerDay) updateData.aiLimitPerDay = parseInt(updateData.aiLimitPerDay);
      if (updateData.mockTestLimit) updateData.mockTestLimit = parseInt(updateData.mockTestLimit);

      const plan = await prisma.plan.update({
        where: { id:id as string },
        data: updateData,
      });

      res.json({ success: true, data: plan });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Plan not found' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Delete plan (admin only)
  static async deletePlan(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      await prisma.plan.delete({
        where: { id:id as string },
      });

      res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Plan not found' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
