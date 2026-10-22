import { NextFunction, Request, Response } from 'express';
import { Role } from '../enums/Role';
import { AppError } from '../utils/AppError';

export function roleMiddleware(...allowedRoles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user) {
      next(AppError.unauthorized('Autenticacao requerida'));
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      next(AppError.forbidden('Voce nao tem permissao para acessar este recurso'));
      return;
    }

    next();
  };
}
