import { Injectable } from '@nestjs/common';
import { DomainError } from '../errors/DomainError';
import { comparePassword } from '../utils/hash';
import { signAccessToken } from '../utils/jwt';
import { UserService } from './UserService';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.userService.findByEmailWithPassword(input.email);

    // Resposta generica: nao revela se o e-mail existe ou se a senha esta incorreta.
    if (!user || !(await comparePassword(input.password, user.password))) {
      throw new DomainError('CREDENCIAIS_INVALIDAS', 'Credenciais invalidas');
    }

    const accessToken = signAccessToken({ sub: user.id, roles: user.roles });
    return { accessToken };
  }
}
