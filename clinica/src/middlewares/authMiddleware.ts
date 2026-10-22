import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

const BEARER_PREFIX = 'Bearer ';

export function authMiddleware(request: Request, _response: Response, next: NextFunction): void {
  const header = request.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(AppError.unauthorized('Token de autenticacao nao fornecido'));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  try {
    const payload = verifyAccessToken(token);
    request.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
}
