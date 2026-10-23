import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { DomainError } from '../errors/DomainError';

// Le o usuario que o JwtAuthGuard colocou na requisicao
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Express.AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.user) {
      throw new DomainError('NAO_AUTENTICADO', 'Autenticacao requerida');
    }

    return request.user;
  },
);
