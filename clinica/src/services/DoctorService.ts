import { Inject, Injectable } from '@nestjs/common';
import { Doctor } from '../entities/Doctor';
import { DomainError } from '../errors/DomainError';
import type { IDoctorRepository } from '../repositories/ports/IDoctorRepository';
import { DOCTOR_REPOSITORY } from '../repositories/ports/IDoctorRepository';
import type { IUserRepository } from '../repositories/ports/IUserRepository';
import { USER_REPOSITORY } from '../repositories/ports/IUserRepository';
import { normalizeEmail } from '../utils/email';
import { hashPassword } from '../utils/hash';
import { buildPage, Paginated, PaginationParams } from '../utils/pagination';

export interface CreateDoctorInput {
  name: string;
  email: string;
  password: string;
  crm: string;
}

export interface ListDoctorsInput extends PaginationParams {
  name?: string;
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

  async list(input: ListDoctorsInput): Promise<Paginated<Doctor>> {
    const name = input.name?.trim();
    const params = { page: input.page, pageSize: input.pageSize };
    const [doctors, total] = await this.doctorRepository.findPage({
      ...params,
      name: name || undefined,
    });

    return buildPage(doctors, total, params);
  }

  async findById(id: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findById(id);

    if (!doctor) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Medico nao encontrado');
    }

    return doctor;
  }

  // Medico ligado ao usuario logado; null se o usuario nao for medico
  findByUserId(userId: number): Promise<Doctor | null> {
    return this.doctorRepository.findByUserId(userId);
  }
}
