import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../dto/LoginDto';
import { AuthService, LoginResult } from '../services/AuthService';

@ApiTags('Autenticacao')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto): Promise<LoginResult> {
    return this.authService.login(body);
  }
}
