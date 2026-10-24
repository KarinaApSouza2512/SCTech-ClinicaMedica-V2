import { WorkShift } from '../../entities/WorkShift';

export interface ShiftData {
  weekDay: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

// Porta usada pelos services; os testes trocam por um duble.
// Os turnos voltam ordenados por dia da semana e hora de inicio.
export interface IWorkScheduleRepository {
  findByDoctorId(doctorId: number): Promise<WorkShift[]>;
  // Apaga a escala atual e grava a nova numa unica transacao
  replaceForDoctor(doctorId: number, shifts: ShiftData[]): Promise<WorkShift[]>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const WORK_SCHEDULE_REPOSITORY = Symbol('IWorkScheduleRepository');
