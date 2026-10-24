import { Doctor } from '../entities/Doctor';
import { Role } from '../enums/Role';

export interface DoctorResponse {
  id: number;
  crm: string;
  user: {
    id: number;
    name: string;
    email: string;
    roles: Role[];
  };
}

// Espera o user carregado; a senha nunca entra na resposta
export function toDoctorResponse(doctor: Doctor): DoctorResponse {
  return {
    id: doctor.id,
    crm: doctor.crm,
    user: {
      id: doctor.user.id,
      name: doctor.user.name,
      email: doctor.user.email,
      roles: doctor.user.roles,
    },
  };
}
