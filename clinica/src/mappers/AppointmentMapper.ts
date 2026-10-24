import { Appointment } from '../entities/Appointment';
import { AppointmentStatus } from '../enums/AppointmentStatus';

// Datas saem em UTC, no formato ISO com Z
export interface AppointmentResponse {
  id: number;
  doctorId: number;
  patientId: number;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
}

export function toAppointmentResponse(appointment: Appointment): AppointmentResponse {
  return {
    id: appointment.id,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status,
  };
}
