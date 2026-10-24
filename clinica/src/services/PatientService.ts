import { Inject, Injectable } from '@nestjs/common';
import { Patient } from '../entities/Patient';
import { DomainError } from '../errors/DomainError';
import type { IPatientRepository } from '../repositories/ports/IPatientRepository';
import { PATIENT_REPOSITORY } from '../repositories/ports/IPatientRepository';

export interface CreatePatientInput {
  name: string;
  cpf: string;
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
}
