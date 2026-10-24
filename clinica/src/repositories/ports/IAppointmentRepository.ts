import { Appointment } from '../../entities/Appointment';

export interface NewAppointmentData {
  doctorId: number;
  patientId: number;
  startsAt: Date;
  endsAt: Date;
}

// Operacoes disponiveis dentro da transacao de agendamento.
// "Ativo" e todo agendamento que nao esta cancelado.
export interface IAppointmentTransaction {
  hasDoctorOverlap(doctorId: number, start: Date, end: Date): Promise<boolean>;
  hasPatientOverlap(patientId: number, start: Date, end: Date): Promise<boolean>;
  create(data: NewAppointmentData): Promise<Appointment>;
}

// Porta usada pelos services; os testes trocam por um duble
export interface IAppointmentRepository {
  // Verificacao e gravacao no mesmo work, dentro de uma unica transacao
  inTransaction<T>(work: (tx: IAppointmentTransaction) => Promise<T>): Promise<T>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const APPOINTMENT_REPOSITORY = Symbol('IAppointmentRepository');
