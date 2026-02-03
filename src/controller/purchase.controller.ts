import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import { PaymentStatus, PlanType } from '../generated/prisma/client';

export class PurchaseController {
  // Create a new purchase/subscription
  static async createPurchase(req: AuthRequest, res: Response) {
    try {
      const { planId, paymentTxnId, provider } = req.body;

      if (!planId) {
        return res.status(400).json({ success: false, error: 'Plan ID is required' });
      }

      // Get the plan
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return res.status(404).json({ success: false, error: 'Plan not found' });
      }

      // Check for existing active subscription
      const now = new Date();
      const existingPurchase = await prisma.purchase.findFirst({
        where: {
          userId: req.user!.id,
          status: 'COMPLETED',
          endDate: { gte: now },
        },
      });

      if (existingPurchase) {
        return res.status(400).json({
          success: false,
          error: 'You already have an active subscription',
          activeUntil: existingPurchase.endDate,
        });
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);

      // Determine plan type from plan name
      let planType: PlanType = PlanType.FREE;
      if (plan.name.toLowerCase().includes('basic')) planType = PlanType.BASIC;
      else if (plan.name.toLowerCase().includes('premium')) planType = PlanType.PREMIUM;
      else if (plan.name.toLowerCase().includes('ultimate')) planType = PlanType.ULTIMATE;

      // Create purchase - if free plan, mark as completed immediately
      const status = plan.price === 0 ? PaymentStatus.COMPLETED : PaymentStatus.PENDING;

      const purchase = await prisma.purchase.create({
        data: {
          userId: req.user!.id,
          planId,
          amount: plan.price,
          paymentTxnId,
          provider,
          status,
          startDate,
          endDate,
        },
        include: { plan: true },
      });

      // If completed (free plan), update user's plan type
      if (status === PaymentStatus.COMPLETED) {
        await prisma.user.update({
          where: { id: req.user!.id },
          data: { planType },
        });
      }

      res.status(201).json({ success: true, data: purchase });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Confirm payment (webhook or manual confirmation)
  static async confirmPayment(req: AuthRequest, res: Response) {
    try {
      const { purchaseId, paymentTxnId } = req.body;

      if (!purchaseId) {
        return res.status(400).json({ success: false, error: 'Purchase ID is required' });
      }

      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: { plan: true },
      });

      if (!purchase) {
        return res.status(404).json({ success: false, error: 'Purchase not found' });
      }

      if (purchase.status === PaymentStatus.COMPLETED) {
        return res.status(400).json({ success: false, error: 'Payment already confirmed' });
      }

      // Determine plan type from plan name
      let planType: PlanType = PlanType.FREE;
      if (purchase.plan.name.toLowerCase().includes('basic')) planType = PlanType.BASIC;
      else if (purchase.plan.name.toLowerCase().includes('premium')) planType = PlanType.PREMIUM;
      else if (purchase.plan.name.toLowerCase().includes('ultimate')) planType = PlanType.ULTIMATE;

      // Update purchase and user in transaction
      const [updatedPurchase] = await prisma.$transaction([
        prisma.purchase.update({
          where: { id: purchaseId },
          data: {
            status: PaymentStatus.COMPLETED,
            paymentTxnId: paymentTxnId || purchase.paymentTxnId,
          },
          include: { plan: true },
        }),
        prisma.user.update({
          where: { id: purchase.userId },
          data: { planType },
        }),
      ]);

      res.json({ success: true, data: updatedPurchase });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Cancel/Refund purchase (admin)
  static async refundPurchase(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const purchase = await prisma.purchase.findUnique({
        where: { id },
      });

      if (!purchase) {
        return res.status(404).json({ success: false, error: 'Purchase not found' });
      }

      // Update purchase status to refunded
      const [updatedPurchase] = await prisma.$transaction([
        prisma.purchase.update({
          where: { id },
          data: { status: PaymentStatus.REFUNDED },
        }),
        // Revert user to free plan
        prisma.user.update({
          where: { id: purchase.userId },
          data: { planType: PlanType.FREE },
        }),
      ]);

      res.json({
        success: true,
        message: 'Purchase refunded successfully',
        data: updatedPurchase,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get all purchases (admin)
  static async getAllPurchases(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;

      const where = status ? { status: status as PaymentStatus } : {};

      const [purchases, total] = await Promise.all([
        prisma.purchase.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.purchase.count({ where }),
      ]);

      res.json({
        success: true,
        data: purchases,
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
}
