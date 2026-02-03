import "dotenv/config";
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { json, urlencoded } from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.route';
import planRoutes from './routes/plan.route';
import userRoutes from './routes/user.route';
import purchaseRoutes from './routes/purchase.route';
import noteRoutes from './routes/note.route';
import orderRoutes from './routes/order.route';
import mockTestRoutes from './routes/mocktest.route';
import analyticsRoutes from './routes/analytics.route';
import aiRoutes from './routes/ai.route';

export const app = express();
app.use(helmet({
  contentSecurityPolicy: false, // Allow Swagger UI to load
}));
app.use(cors());
app.use(morgan('dev'));
app.use(json());
app.use(urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Note LLM API Docs',
}));

// Serve OpenAPI spec as JSON
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/users', userRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tests', mockTestRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: API is running...
 */
app.use("/health", (req: Request, res: Response) => {
  res.send("API is running...");
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
  console.log(`Swagger docs available at http://localhost:${process.env.PORT || 3000}/api-docs`);
});