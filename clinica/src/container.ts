import { AdminController } from './controllers/AdminController';
import { AuthController } from './controllers/AuthController';
import { UserController } from './controllers/UserController';
import { UserRepository } from './repositories/UserRepository';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';

const userService = new UserService(UserRepository);
const authService = new AuthService(userService);

export const authController = new AuthController(authService);
export const userController = new UserController(userService);
export const adminController = new AdminController();
