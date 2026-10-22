import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/Roles';
import { Role } from '../enums/Role';
import { AppError } from '../utils/AppError';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Rota sem @Roles so exige autenticacao
    if (!allowedRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (!request.user) {
      throw AppError.unauthorized('Autenticacao requerida');
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw AppError.forbidden('Voce nao tem permissao para acessar este recurso');
    }

    return true;
  }
}
