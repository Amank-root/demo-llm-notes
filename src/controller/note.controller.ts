import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export class NoteController {
  // Get all approved notes (public)
  static async getAllNotes(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const subject = req.query.subject as string;
      const examType = req.query.examType as string;
      const minPrice = parseFloat(req.query.minPrice as string) || 0;
      const maxPrice = parseFloat(req.query.maxPrice as string) || Number.MAX_VALUE;
      const skip = (page - 1) * limit;

      const where: any = {
        approved: true,
        price: { gte: minPrice, lte: maxPrice },
      };

      if (subject) where.subject = subject;
      if (examType) where.examType = examType;

      const [notes, total] = await Promise.all([
        prisma.note.findMany({
          where,
          skip,
          take: limit,
          include: {
            seller: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.note.count({ where }),
      ]);

      res.json({
        success: true,
        data: notes,
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

  // Get single note
  static async getNoteById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const note = await prisma.note.findUnique({
        where: { id },
        include: {
          seller: { select: { id: true, name: true } },
        },
      });

      if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }

      // Only show unapproved notes to seller or admin
      if (!note.approved && req.user?.id !== note.sellerId && req.user?.role !== 'ADMIN') {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }

      res.json({ success: true, data: note });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Create a note (seller)
  static async createNote(req: AuthRequest, res: Response) {
    try {
      const { title, subject, examType, description, price, fileUrl, thumbnailUrl } = req.body;

      if (!title || !subject || !examType || price === undefined || !fileUrl) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, subject, examType, price, fileUrl',
        });
      }

      // Ensure seller has a wallet
      await prisma.sellerWallet.upsert({
        where: { sellerId: req.user!.id },
        update: {},
        create: { sellerId: req.user!.id, balance: 0 },
      });

      const note = await prisma.note.create({
        data: {
          title,
          subject,
          examType,
          description,
          price: parseFloat(price),
          sellerId: req.user!.id,
          fileUrl,
          thumbnailUrl,
          approved: false, // Needs admin approval
        },
      });

      res.status(201).json({ success: true, data: note });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update note (seller or admin)
  static async updateNote(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { title, subject, examType, description, price, fileUrl, thumbnailUrl } = req.body;

      const existingNote = await prisma.note.findUnique({ where: { id } });

      if (!existingNote) {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }

      // Only seller or admin can update
      if (existingNote.sellerId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      const note = await prisma.note.update({
        where: { id },
        data: {
          title,
          subject,
          examType,
          description,
          price: price ? parseFloat(price) : undefined,
          fileUrl,
          thumbnailUrl,
          // Reset approval if content changed
          approved: req.user!.role === 'ADMIN' ? existingNote.approved : false,
        },
      });

      res.json({ success: true, data: note });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Delete note (seller or admin)
  static async deleteNote(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const existingNote = await prisma.note.findUnique({ where: { id } });

      if (!existingNote) {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }

      // Only seller or admin can delete
      if (existingNote.sellerId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      await prisma.note.delete({ where: { id } });

      res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get my notes (seller)
  static async getMyNotes(req: AuthRequest, res: Response) {
    try {
      const notes = await prisma.note.findMany({
        where: { sellerId: req.user!.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: notes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get my purchased notes
  static async getMyPurchasedNotes(req: AuthRequest, res: Response) {
    try {
      const orders = await prisma.noteOrder.findMany({
        where: { buyerId: req.user!.id },
        include: {
          note: {
            include: { seller: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Approve/Reject note
  static async approveNote(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { approved } = req.body;

      const note = await prisma.note.update({
        where: { id },
        data: { approved },
      });

      res.json({
        success: true,
        message: approved ? 'Note approved' : 'Note rejected',
        data: note,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Get pending notes for approval
  static async getPendingNotes(req: AuthRequest, res: Response) {
    try {
      const notes = await prisma.note.findMany({
        where: { approved: false },
        include: {
          seller: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({ success: true, data: notes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
