import { MedicalRecord } from '../entities/MedicalRecord';

export interface MedicalRecordResponse {
  id: number;
  patientId: number;
  doctorId: number;
  text: string;
  createdAt: string;
}

export function toMedicalRecordResponse(record: MedicalRecord): MedicalRecordResponse {
  return {
    id: record.id,
    patientId: record.patientId,
    doctorId: record.doctorId,
    text: record.text,
    createdAt: record.createdAt.toISOString(),
  };
}
