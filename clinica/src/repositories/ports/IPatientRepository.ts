import { Patient } from '../../entities/Patient';
import { PaginationParams } from '../../utils/pagination';

export interface NewPatientData {
  name: string;
  cpf: string;
}

export interface PatientFilter extends PaginationParams {
  // Trecho do nome; sem ele, lista todos
  name?: string;
}

// Porta usada pelos services; os testes trocam por um duble.
// Removidos logicamente ficam de fora, exceto em findByCpf.
export interface IPatientRepository {
  findById(id: number): Promise<Patient | null>;
  // Inclui removidos: o CPF continua reservado pela constraint unique
  findByCpf(cpf: string): Promise<Patient | null>;
  // Pagina pedida e total de registros que atendem ao filtro
  findPage(filter: PatientFilter): Promise<[Patient[], number]>;
  create(data: NewPatientData): Promise<Patient>;
  save(patient: Patient): Promise<Patient>;
  softDelete(id: number): Promise<void>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const PATIENT_REPOSITORY = Symbol('IPatientRepository');
