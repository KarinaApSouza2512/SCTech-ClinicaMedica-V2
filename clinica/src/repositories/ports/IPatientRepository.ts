import { Patient } from '../../entities/Patient';

export interface NewPatientData {
  name: string;
  cpf: string;
}

// Porta usada pelos services; os testes trocam por um duble
export interface IPatientRepository {
  // Inclui removidos: o CPF continua reservado pela constraint unique
  findByCpf(cpf: string): Promise<Patient | null>;
  create(data: NewPatientData): Promise<Patient>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const PATIENT_REPOSITORY = Symbol('IPatientRepository');
