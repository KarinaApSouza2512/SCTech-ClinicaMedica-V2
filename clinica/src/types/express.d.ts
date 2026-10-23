import { Role } from '../enums/Role';

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: number;
      roles: Role[];
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
