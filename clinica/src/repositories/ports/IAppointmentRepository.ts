import { Appointment } from '../../entities/Appointment';

export interface NewAppointmentData {
  doctorId: number;
  patientId: number;
  startsAt: Date;
  endsAt: Date;
}

// Porta usada pelos services; os testes trocam por um duble
export interface IAppointmentRepository {
  create(data: NewAppointmentData): Promise<Appointment>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const APPOINTMENT_REPOSITORY = Symbol('IAppointmentRepository');
