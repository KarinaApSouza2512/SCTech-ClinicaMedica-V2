import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../enums/Role';
import { User } from '../entities/User';
import { DomainError } from '../errors/DomainError';
import type { IUserRepository } from '../repositories/ports/IUserRepository';
import { USER_REPOSITORY } from '../repositories/ports/IUserRepository';
import { hashPassword } from '../utils/hash';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roles?: Role[];
}

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  createdAt: Date;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Perfil repetido na lista nao muda nada; guarda cada um uma vez
function uniqueRoles(roles: Role[]): Role[] {
  return [...new Set(roles)];
}

@Injectable()
export class UserService {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository) {}

  toPublic(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      createdAt: user.createdAt,
    };
  }

  async create(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw new DomainError('EMAIL_JA_CADASTRADO', 'E-mail ja cadastrado');
    }

    return this.userRepository.create({
      name: input.name.trim(),
      email,
      password: await hashPassword(input.password),
      roles: uniqueRoles(input.roles ?? [Role.SECRETARY]),
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Usuario nao encontrado');
    }

    return user;
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findByEmailWithPassword(normalizeEmail(email));
  }
}
