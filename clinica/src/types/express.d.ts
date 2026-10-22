import { Role } from '../enums/Role';

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: string;
      email: string;
      role: Role;
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
