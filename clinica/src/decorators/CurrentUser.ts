import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AppError } from '../utils/AppError';

// Le o usuario que o JwtAuthGuard colocou na requisicao
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Express.AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.user) {
      throw AppError.unauthorized('Autenticacao requerida');
    }

    return request.user;
  },
);
