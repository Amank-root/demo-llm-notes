import { Router } from 'express';
import { NoteController } from '../controller/note.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/notes/admin/pending:
 *   get:
 *     summary: Get pending notes for approval (Admin only)
 *     tags: [Notes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending notes
 *       403:
 *         description: Admin access required
 */
router.get('/admin/pending', authenticate, requireAdmin, NoteController.getPendingNotes);

/**
 * @swagger
 * /api/notes/seller/my-notes:
 *   get:
 *     summary: Get notes created by the authenticated seller
 *     tags: [Notes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller's notes
 */
router.get('/seller/my-notes', authenticate, NoteController.getMyNotes);

/**
 * @swagger
 * /api/notes/buyer/purchased:
 *   get:
 *     summary: Get notes purchased by the authenticated user
 *     tags: [Notes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchased notes
 */
router.get('/buyer/purchased', authenticate, NoteController.getMyPurchasedNotes);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all approved notes (Public)
 *     tags: [Notes]
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
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: examType
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Note'
 *                 pagination:
 *                   type: object
 */
router.get('/', NoteController.getAllNotes);

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a note by ID (Public)
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Note details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         description: Note not found
 */
router.get('/:id', NoteController.getNoteById);

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note (Seller)
 *     tags: [Notes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - subject
 *               - examType
 *               - price
 *               - fileUrl
 *             properties:
 *               title:
 *                 type: string
 *               subject:
 *                 type: string
 *               examType:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               fileUrl:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               previewUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created (pending approval)
 *       400:
 *         description: Invalid request
 */
router.post('/', authenticate, NoteController.createNote);

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Update a note (Owner only)
 *     tags: [Notes]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Note updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Note not found
 */
router.put('/:id', authenticate, NoteController.updateNote);

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note (Owner only)
 *     tags: [Notes]
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
 *         description: Note deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Note not found
 */
router.delete('/:id', authenticate, NoteController.deleteNote);

/**
 * @swagger
 * /api/notes/{id}/approve:
 *   patch:
 *     summary: Approve or reject a note (Admin only)
 *     tags: [Notes]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note status updated
 *       404:
 *         description: Note not found
 */
router.patch('/:id/approve', authenticate, requireAdmin, NoteController.approveNote);

export default router;
