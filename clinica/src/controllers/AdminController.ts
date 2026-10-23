import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../decorators/CurrentUser';
import { Roles } from '../decorators/Roles';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';

interface PingResponse {
  message: string;
  requestedBy: Express.AuthenticatedUser;
  timestamp: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('ping')
  @Roles(Role.ADMIN)
  ping(@CurrentUser() user: Express.AuthenticatedUser): PingResponse {
    return {
      message: 'pong',
      requestedBy: { id: user.id, email: user.email, roles: user.roles },
      timestamp: new Date().toISOString(),
    };
  }
}
