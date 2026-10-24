import { MedicalRecord } from '../../entities/MedicalRecord';
import { PaginationParams } from '../../utils/pagination';

export interface NewMedicalRecordData {
  patientId: number;
  doctorId: number;
  text: string;
}

// Porta usada pelos services; os testes trocam por um duble
export interface IMedicalRecordRepository {
  create(data: NewMedicalRecordData): Promise<MedicalRecord>;
  // Pagina do prontuario do paciente, do registro mais recente para o mais antigo
  findPageByPatient(patientId: number, page: PaginationParams): Promise<[MedicalRecord[], number]>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const MEDICAL_RECORD_REPOSITORY = Symbol('IMedicalRecordRepository');
