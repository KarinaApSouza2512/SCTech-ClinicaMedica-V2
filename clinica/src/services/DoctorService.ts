import { Inject, Injectable } from '@nestjs/common';
import { Doctor } from '../entities/Doctor';
import { DomainError } from '../errors/DomainError';
import type { IDoctorRepository } from '../repositories/ports/IDoctorRepository';
import { DOCTOR_REPOSITORY } from '../repositories/ports/IDoctorRepository';
import type { IUserRepository } from '../repositories/ports/IUserRepository';
import { USER_REPOSITORY } from '../repositories/ports/IUserRepository';
import { normalizeEmail } from '../utils/email';
import { hashPassword } from '../utils/hash';

export interface CreateDoctorInput {
  name: string;
  email: string;
  password: string;
  crm: string;
}

@Injectable()
export class DoctorService {
  constructor(
    @Inject(DOCTOR_REPOSITORY) private readonly doctorRepository: IDoctorRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  // As consultas antes da transacao so dao resposta rapida; quem garante e o banco
  async create(input: CreateDoctorInput): Promise<Doctor> {
    const email = normalizeEmail(input.email);
    const crm = input.crm.trim();

    if (await this.userRepository.findByEmail(email)) {
      throw new DomainError('EMAIL_JA_CADASTRADO', 'E-mail ja cadastrado');
    }

    if (await this.doctorRepository.findByCrm(crm)) {
      throw new DomainError('CRM_JA_CADASTRADO', 'CRM ja cadastrado');
    }

    return this.doctorRepository.createWithUser({
      name: input.name.trim(),
      email,
      password: await hashPassword(input.password),
      crm,
    });
  }
}
