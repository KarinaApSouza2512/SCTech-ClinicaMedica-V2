import { Appointment } from '../../entities/Appointment';
import { AppointmentStatus } from '../../enums/AppointmentStatus';
import { PaginationParams } from '../../utils/pagination';

export interface NewAppointmentData {
  doctorId: number;
  patientId: number;
  startsAt: Date;
  endsAt: Date;
}

export interface AppointmentFilter extends PaginationParams {
  doctorId?: number;
  patientId?: number;
  status?: AppointmentStatus;
  // Inicio da consulta em [startsFrom, startsBefore)
  startsFrom?: Date;
  startsBefore?: Date;
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
  findById(id: number): Promise<Appointment | null>;
  // Agendamentos nao cancelados do medico que tocam [start, end), ordenados por inicio
  findActiveByDoctorBetween(doctorId: number, start: Date, end: Date): Promise<Appointment[]>;
  // Pagina pedida, ordenada por inicio, e total de registros que atendem ao filtro
  findPage(filter: AppointmentFilter): Promise<[Appointment[], number]>;
  // Grava o novo status so se o atual ainda for from; false se outra requisicao mudou antes
  updateStatus(id: number, from: AppointmentStatus, to: AppointmentStatus): Promise<boolean>;
  // Executa work numa transacao que segura o lock da linha do medico ate o fim:
  // outro agendamento do mesmo medico espera, e so verifica depois deste gravar
  withDoctorLock<T>(
    doctorId: number,
    work: (tx: IAppointmentTransaction) => Promise<T>,
  ): Promise<T>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const APPOINTMENT_REPOSITORY = Symbol('IAppointmentRepository');
