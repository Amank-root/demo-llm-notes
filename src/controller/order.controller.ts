import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import { EscrowStatus, DisputeStatus } from '../generated/prisma/client';

const PLATFORM_COMMISSION_PERCENT = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || '10');
const ESCROW_HOLD_HOURS = parseInt(process.env.ESCROW_HOLD_HOURS || '48');

export class OrderController {
  // Purchase a note
  static async purchaseNote(req: AuthRequest, res: Response) {
    try {
      const { noteId, paymentTxnId } = req.body;

      if (!noteId) {
        return res.status(400).json({ success: false, error: 'Note ID is required' });
      }

      // Get the note
      const note = await prisma.note.findUnique({
        where: { id: noteId },
      });

      if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }

      if (!note.approved) {
        return res.status(400).json({ success: false, error: 'Note is not available for purchase' });
      }

      // Check if buyer already owns this note
      const existingOrder = await prisma.noteOrder.findFirst({
        where: {
          noteId,
          buyerId: req.user!.id,
          escrowStatus: { in: [EscrowStatus.HELD, EscrowStatus.RELEASED] },
        },
      });

      if (existingOrder) {
        return res.status(400).json({ success: false, error: 'You already own this note' });
      }

      // Prevent buying own notes
      if (note.sellerId === req.user!.id) {
        return res.status(400).json({ success: false, error: 'Cannot purchase your own note' });
      }

      // Calculate commission
      const commissionAmount = (note.price * PLATFORM_COMMISSION_PERCENT) / 100;

      // Create order with escrow
      const order = await prisma.noteOrder.create({
        data: {
          noteId,
          buyerId: req.user!.id,
          sellerId: note.sellerId,
          amount: note.price,
          commissionAmount,
          escrowStatus: EscrowStatus.HELD,
        },
        include: {
          note: true,
        },
      });

      // Increment download count
      await prisma.note.update({
        where: { id: noteId },
        data: { downloads: { increment: 1 } },
      });

      res.status(201).json({
        success: true,
        data: order,
        message: `Purchase successful. Escrow will be held for ${ESCROW_HOLD_HOURS} hours.`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get buyer's orders
  static async getMyOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await prisma.noteOrder.findMany({
        where: { buyerId: req.user!.id },
        include: {
          note: { include: { seller: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get seller's sales
  static async getMySales(req: AuthRequest, res: Response) {
    try {
      const orders = await prisma.noteOrder.findMany({
        where: { sellerId: req.user!.id },
        include: {
          note: true,
          buyer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Create dispute
  static async createDispute(req: AuthRequest, res: Response) {
    try {
      const { orderId, reason } = req.body;

      if (!orderId || !reason) {
        return res.status(400).json({ success: false, error: 'Order ID and reason are required' });
      }

      const order = await prisma.noteOrder.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      // Only buyer can dispute
      if (order.buyerId !== req.user!.id) {
        return res.status(403).json({ success: false, error: 'Only the buyer can create a dispute' });
      }

      // Can only dispute held orders
      if (order.escrowStatus !== EscrowStatus.HELD) {
        return res.status(400).json({ success: false, error: 'Can only dispute orders in escrow' });
      }

      // Check if dispute already exists
      const existingDispute = await prisma.dispute.findFirst({
        where: { orderId, status: DisputeStatus.OPEN },
      });

      if (existingDispute) {
        return res.status(400).json({ success: false, error: 'A dispute already exists for this order' });
      }

      // Create dispute and update order status
      const [dispute] = await prisma.$transaction([
        prisma.dispute.create({
          data: {
            orderId,
            userId: req.user!.id,
            reason,
            status: DisputeStatus.OPEN,
          },
        }),
        prisma.noteOrder.update({
          where: { id: orderId },
          data: { escrowStatus: EscrowStatus.DISPUTED },
        }),
      ]);

      res.status(201).json({ success: true, data: dispute });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get my disputes
  static async getMyDisputes(req: AuthRequest, res: Response) {
    try {
      const disputes = await prisma.dispute.findMany({
        where: { userId: req.user!.id },
        include: {
          order: { include: { note: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: disputes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get wallet balance
  static async getWallet(req: AuthRequest, res: Response) {
    try {
      let wallet = await prisma.sellerWallet.findUnique({
        where: { sellerId: req.user!.id },
      });

      if (!wallet) {
        wallet = await prisma.sellerWallet.create({
          data: { sellerId: req.user!.id, balance: 0 },
        });
      }

      // Get recent transactions
      const transactions = await prisma.transaction.findMany({
        where: { sellerId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      res.json({ success: true, data: { wallet, transactions } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Get all orders
  static async getAllOrders(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as EscrowStatus;
      const skip = (page - 1) * limit;

      const where = status ? { escrowStatus: status } : {};

      const [orders, total] = await Promise.all([
        prisma.noteOrder.findMany({
          where,
          skip,
          take: limit,
          include: {
            note: true,
            buyer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.noteOrder.count({ where }),
      ]);

      res.json({
        success: true,
        data: orders,
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

  // Admin: Release escrow manually
  static async releaseEscrow(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const order = await prisma.noteOrder.findUnique({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (order.escrowStatus !== EscrowStatus.HELD) {
        return res.status(400).json({ success: false, error: 'Order is not in escrow' });
      }

      const sellerAmount = order.amount - order.commissionAmount;

      // Release escrow: update order, credit wallet, create transaction
      await prisma.$transaction([
        prisma.noteOrder.update({
          where: { id },
          data: {
            escrowStatus: EscrowStatus.RELEASED,
            releasedAt: new Date(),
          },
        }),
        prisma.sellerWallet.upsert({
          where: { sellerId: order.sellerId },
          update: { balance: { increment: sellerAmount } },
          create: { sellerId: order.sellerId, balance: sellerAmount },
        }),
        prisma.transaction.create({
          data: {
            sellerId: order.sellerId,
            orderId: order.id,
            amount: sellerAmount,
            type: 'ESCROW_RELEASE',
          },
        }),
      ]);

      res.json({ success: true, message: 'Escrow released successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Refund order
  static async refundOrder(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const order = await prisma.noteOrder.findUnique({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (order.escrowStatus === EscrowStatus.RELEASED) {
        return res.status(400).json({ success: false, error: 'Cannot refund released order' });
      }

      await prisma.noteOrder.update({
        where: { id },
        data: { escrowStatus: EscrowStatus.REFUNDED },
      });

      res.json({ success: true, message: 'Order refunded successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Get all disputes
  static async getAllDisputes(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as DisputeStatus;
      const where = status ? { status } : {};

      const disputes = await prisma.dispute.findMany({
        where,
        include: {
          order: { include: { note: true, buyer: { select: { id: true, name: true } } } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: disputes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Resolve dispute
  static async resolveDispute(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { status, resolution, refund } = req.body;

      if (!status || !['RESOLVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { order: true },
      });

      if (!dispute) {
        return res.status(404).json({ success: false, error: 'Dispute not found' });
      }

      // Update dispute
      const updatedDispute = await prisma.dispute.update({
        where: { id },
        data: {
          status,
          resolution,
          resolvedBy: req.user!.id,
          resolvedAt: new Date(),
        },
      });

      // If refunding, update order status
      if (refund && status === 'RESOLVED') {
        await prisma.noteOrder.update({
          where: { id: dispute.orderId },
          data: { escrowStatus: EscrowStatus.REFUNDED },
        });
      } else {
        // Release to seller if dispute rejected or resolved without refund
        const order = dispute.order;
        const sellerAmount = order.amount - order.commissionAmount;

        await prisma.$transaction([
          prisma.noteOrder.update({
            where: { id: order.id },
            data: {
              escrowStatus: EscrowStatus.RELEASED,
              releasedAt: new Date(),
            },
          }),
          prisma.sellerWallet.upsert({
            where: { sellerId: order.sellerId },
            update: { balance: { increment: sellerAmount } },
            create: { sellerId: order.sellerId, balance: sellerAmount },
          }),
          prisma.transaction.create({
            data: {
              sellerId: order.sellerId,
              orderId: order.id,
              amount: sellerAmount,
              type: 'DISPUTE_RESOLVED',
            },
          }),
        ]);
      }

      res.json({ success: true, data: updatedDispute });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Cron job: Auto-release escrow after hold period
  static async processEscrowRelease(req: AuthRequest, res: Response) {
    try {
      const holdHoursAgo = new Date();
      holdHoursAgo.setHours(holdHoursAgo.getHours() - ESCROW_HOLD_HOURS);

      // Find orders to release
      const ordersToRelease = await prisma.noteOrder.findMany({
        where: {
          escrowStatus: EscrowStatus.HELD,
          escrowHeldAt: { lte: holdHoursAgo },
        },
      });

      let releasedCount = 0;

      for (const order of ordersToRelease) {
        const sellerAmount = order.amount - order.commissionAmount;

        await prisma.$transaction([
          prisma.noteOrder.update({
            where: { id: order.id },
            data: {
              escrowStatus: EscrowStatus.RELEASED,
              releasedAt: new Date(),
            },
          }),
          prisma.sellerWallet.upsert({
            where: { sellerId: order.sellerId },
            update: { balance: { increment: sellerAmount } },
            create: { sellerId: order.sellerId, balance: sellerAmount },
          }),
          prisma.transaction.create({
            data: {
              sellerId: order.sellerId,
              orderId: order.id,
              amount: sellerAmount,
              type: 'ESCROW_AUTO_RELEASE',
            },
          }),
        ]);

        releasedCount++;
      }

      res.json({
        success: true,
        message: `Released ${releasedCount} orders from escrow`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
