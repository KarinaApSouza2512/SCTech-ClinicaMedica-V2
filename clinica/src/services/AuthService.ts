import { Injectable } from '@nestjs/common';
import { Role } from '../enums/Role';
import { DomainError } from '../errors/DomainError';
import { comparePassword } from '../utils/hash';
import { signAccessToken } from '../utils/jwt';
import { PublicUser, UserService } from './UserService';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  roles?: Role[];
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    const user = await this.userService.create(input);
    return this.userService.toPublic(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userService.findByEmailWithPassword(input.email);

    // Resposta generica: nao revela se o e-mail existe ou se a senha esta incorreta.
    if (!user || !(await comparePassword(input.password, user.password))) {
      throw new DomainError('CREDENCIAIS_INVALIDAS', 'Credenciais invalidas');
    }

    const token = signAccessToken({ sub: user.id, email: user.email, roles: user.roles });
    return { token, user: this.userService.toPublic(user) };
  }
}
