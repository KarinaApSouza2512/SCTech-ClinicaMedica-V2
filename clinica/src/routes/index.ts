import { Request, Response, Router } from 'express';
import { AppDataSource } from '../database/data-source';
import { adminRoutes } from './admin.routes';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';

export const router = Router();

router.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    database: AppDataSource.isInitialized ? 'up' : 'down',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
