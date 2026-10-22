import { Router } from 'express';
import { adminController } from '../container';
import { Role } from '../enums/Role';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const adminRoutes = Router();

adminRoutes.get('/ping', authMiddleware, roleMiddleware(Role.ADMIN), adminController.ping);

export { adminRoutes };
