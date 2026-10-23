import { User } from '../../entities/User';
import { Role } from '../../enums/Role';

export interface NewUserData {
  name: string;
  email: string;
  // Senha ja com hash
  password: string;
  roles: Role[];
}

// Porta usada pelos services; os testes trocam por um duble
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<User | null>;
  create(data: NewUserData): Promise<User>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const USER_REPOSITORY = Symbol('IUserRepository');
