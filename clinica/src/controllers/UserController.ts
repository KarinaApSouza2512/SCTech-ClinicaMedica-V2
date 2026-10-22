import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../decorators/CurrentUser';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { PublicUser, UserService } from '../services/UserService';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async me(@CurrentUser() authUser: Express.AuthenticatedUser): Promise<PublicUser> {
    const user = await this.userService.findById(authUser.id);
    return this.userService.toPublic(user);
  }
}
