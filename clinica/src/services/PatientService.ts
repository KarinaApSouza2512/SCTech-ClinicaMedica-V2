import { Inject, Injectable } from '@nestjs/common';
import { Patient } from '../entities/Patient';
import { DomainError } from '../errors/DomainError';
import type { IPatientRepository } from '../repositories/ports/IPatientRepository';
import { PATIENT_REPOSITORY } from '../repositories/ports/IPatientRepository';
import { buildPage, Paginated, PaginationParams } from '../utils/pagination';

export interface CreatePatientInput {
  name: string;
  cpf: string;
}

export interface UpdatePatientInput {
  name: string;
}

export interface ListPatientsInput extends PaginationParams {
  name?: string;
}

@Injectable()
export class PatientService {
  constructor(
    @Inject(PATIENT_REPOSITORY) private readonly patientRepository: IPatientRepository,
  ) {}

  // A constraint UQ_patients_cpf cobre a corrida entre duas requisicoes simultaneas
  async create(input: CreatePatientInput): Promise<Patient> {
    const existing = await this.patientRepository.findByCpf(input.cpf);

    if (existing) {
      throw new DomainError('CPF_JA_CADASTRADO', 'CPF ja cadastrado');
    }

    return this.patientRepository.create({ name: input.name.trim(), cpf: input.cpf });
  }

  async list(input: ListPatientsInput): Promise<Paginated<Patient>> {
    const name = input.name?.trim();
    const params = { page: input.page, pageSize: input.pageSize };
    const [patients, total] = await this.patientRepository.findPage({
      ...params,
      name: name || undefined,
    });

    return buildPage(patients, total, params);
  }

  async findById(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findById(id);

    if (!patient) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Paciente nao encontrado');
    }

    return patient;
  }

  async update(id: number, input: UpdatePatientInput): Promise<Patient> {
    const patient = await this.findById(id);
    patient.name = input.name.trim();

    return this.patientRepository.save(patient);
  }

  // Busca antes para que remover duas vezes tambem gere 404
  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.patientRepository.softDelete(id);
  }
}
