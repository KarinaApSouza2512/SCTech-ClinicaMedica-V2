import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../decorators/CurrentUser';
import { Roles } from '../decorators/Roles';
import { CreateUserDto } from '../dto/CreateUserDto';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';
import { PublicUser, UserService } from '../services/UserService';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Unica forma de criar usuario: exige um admin autenticado
  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() body: CreateUserDto): Promise<PublicUser> {
    const user = await this.userService.create(body);
    return this.userService.toPublic(user);
  }

  @Get('me')
  async me(@CurrentUser() authUser: Express.AuthenticatedUser): Promise<PublicUser> {
    const user = await this.userService.findById(authUser.id);
    return this.userService.toPublic(user);
  }
}
