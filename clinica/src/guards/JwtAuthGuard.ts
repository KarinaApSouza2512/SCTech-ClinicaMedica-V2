import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { DomainError } from '../errors/DomainError';
import { verifyAccessToken } from '../utils/jwt';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw new DomainError('NAO_AUTENTICADO', 'Token de autenticacao nao fornecido');
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    const payload = verifyAccessToken(token);
    request.user = { id: payload.sub, email: payload.email, role: payload.role };

    return true;
  }
}
