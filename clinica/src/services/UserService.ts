import { Injectable } from '@nestjs/common';
import { Role } from '../enums/Role';
import { User } from '../entities/User';
import { UserRepository } from '../repositories/UserRepository';
import { DomainError } from '../errors/DomainError';
import { hashPassword } from '../utils/hash';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roles?: Role[];
}

export interface PublicUser {
  id: string;
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
  constructor(private readonly userRepository: UserRepository) {}

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

    const user = this.userRepository.create({
      name: input.name.trim(),
      email,
      password: await hashPassword(input.password),
      roles: uniqueRoles(input.roles ?? [Role.SECRETARY]),
    });

    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User> {
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
