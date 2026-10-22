import { Router } from 'express';
import { userController } from '../container';
import { authMiddleware } from '../middlewares/authMiddleware';

const userRoutes = Router();

userRoutes.get('/me', authMiddleware, userController.me);

export { userRoutes };
