import { Router } from 'express';
import { authController } from '../container';
import { LoginDto } from '../dto/LoginDto';
import { RegisterDto } from '../dto/RegisterDto';
import { validateDto } from '../middlewares/validateDto';

const authRoutes = Router();

authRoutes.post('/register', validateDto(RegisterDto), authController.register);
authRoutes.post('/login', validateDto(LoginDto), authController.login);

export { authRoutes };
