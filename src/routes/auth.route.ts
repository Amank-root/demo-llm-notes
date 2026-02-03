import { type Request, type Response, Router } from 'express';
import admin from '../config/firebase';
import prisma from '../config/db';
import { UserRole } from '../generated/prisma/client';

const router = Router();

interface RegisterRequest {
  email: string;
  password?: string;
  displayName?: string;
  role?: 'user' | 'admin';
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     userId:
 *                       type: string
 *       400:
 *         description: Email and password required
 *       500:
 *         description: Registration failed
 */
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 1. Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // 2. Define the role (default to 'user')
    const assignedRole = 'user';

    // 3. Set Custom Claims for the role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: assignedRole });

    // 4. Create user in PostgreSQL
    const user = await prisma.user.create({
      data: {
        firebaseUid: userRecord.uid,
        email: email,
        name: displayName || email.split('@')[0],
        role: UserRole.USER,
      },
    });

    res.status(201).json({
      success: true,
      message: `User registered successfully`,
      data: {
        uid: userRecord.uid,
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    // If Firebase user was created but Postgres failed, we should handle it
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'An error occurred during registration.',
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Verify Firebase token and get user data
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or missing token
 */
router.post('/login', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Find or create user in Postgres
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      include: { profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || '',
          name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          role: (decodedToken.role as UserRole) || UserRole.USER,
        },
        include: { profile: true },
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        planType: user.planType,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid token',
    });
  }
});

// Create admin user (should be protected or removed in production)
router.post('/create-admin', async (req: Request, res: Response) => {
  const { email, password, displayName, adminSecret } = req.body;

  // Simple secret check - in production use environment variable
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

    const user = await prisma.user.create({
      data: {
        firebaseUid: userRecord.uid,
        email: email,
        name: displayName || email.split('@')[0],
        role: UserRole.ADMIN,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        uid: userRecord.uid,
        userId: user.id,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'An error occurred.',
    });
  }
});

export default router;