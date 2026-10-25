import { Patient } from '../entities/Patient';

// Formato da resposta da API; deletedAt nao faz parte do contrato. Datas em ISO com Z
export interface PatientResponse {
  id: number;
  name: string;
  cpf: string;
  createdAt: string;
}

export function toPatientResponse(patient: Patient): PatientResponse {
  return {
    id: patient.id,
    name: patient.name,
    cpf: patient.cpf,
    createdAt: patient.createdAt.toISOString(),
  };
}
