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
  // Trava a linha do paciente ate o fim da transacao (sempre depois do lock do medico)
  lockPatient(patientId: number): Promise<void>;
  hasDoctorOverlap(doctorId: number, start: Date, end: Date): Promise<boolean>;
  hasPatientOverlap(patientId: number, start: Date, end: Date): Promise<boolean>;
  create(data: NewAppointmentData): Promise<Appointment>;
}

// Porta usada pelos services; os testes trocam por um duble
export interface IAppointmentRepository {
  // Executa work numa transacao que segura o lock da linha do medico ate o fim:
  // outro agendamento do mesmo medico espera, e so verifica depois deste gravar
  withDoctorLock<T>(
    doctorId: number,
    work: (tx: IAppointmentTransaction) => Promise<T>,
  ): Promise<T>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const APPOINTMENT_REPOSITORY = Symbol('IAppointmentRepository');
