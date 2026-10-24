import { AppointmentStatus } from '../enums/AppointmentStatus';
import { ShiftData } from '../repositories/ports/IWorkScheduleRepository';
import { timeToMinutes } from '../utils/time';

// Turno em que o horario local cai, ou null se ele nao existe na escala (RN07):
// dentro do turno, alinhado a grade de consultas e cabendo inteiro ate o fim
export function findShiftForSlot<T extends ShiftData>(
  shifts: T[],
  weekDay: number,
  minutesOfDay: number,
): T | null {
  const shift = shifts.find((candidate) => {
    const start = timeToMinutes(candidate.startTime);
    const end = timeToMinutes(candidate.endTime);

    return candidate.weekDay === weekDay && minutesOfDay >= start && minutesOfDay < end;
  });

  if (!shift) {
    return null;
  }

  const sinceStart = minutesOfDay - timeToMinutes(shift.startTime);
  const aligned = sinceStart % shift.slotDurationMinutes === 0;
  const fits = minutesOfDay + shift.slotDurationMinutes <= timeToMinutes(shift.endTime);

  return aligned && fits ? shift : null;
}

export interface Period {
  start: Date;
  end: Date;
}

// Periodos semiabertos [inicio, fim): consultas encostadas nao conflitam (RN08).
// As consultas de conflito no repositorio aplicam esta mesma condicao em SQL.
export function periodsOverlap(a: Period, b: Period): boolean {
  return a.start < b.end && b.start < a.end;
}

// Quem pede a mudanca de status, do ponto de vista daquela consulta
export interface StatusActor {
  isAdmin: boolean;
  isSecretary: boolean;
  // Tem perfil doctor e e o medico desta consulta
  isAppointmentDoctor: boolean;
}

export type TransitionAuthority = (actor: StatusActor) => boolean;

const doctorOrAdmin: TransitionAuthority = (actor) => actor.isAppointmentDoctor || actor.isAdmin;
const anyStaff: TransitionAuthority = (actor) => doctorOrAdmin(actor) || actor.isSecretary;

// Tabela da secao 4.9.7: de -> para -> quem pode. done e cancelled sao finais (RN11, RN12)
const TRANSITIONS: Partial<
  Record<AppointmentStatus, Partial<Record<AppointmentStatus, TransitionAuthority>>>
> = {
  [AppointmentStatus.SCHEDULED]: {
    [AppointmentStatus.IN_PROGRESS]: doctorOrAdmin,
    [AppointmentStatus.CANCELLED]: anyStaff,
  },
  [AppointmentStatus.IN_PROGRESS]: {
    [AppointmentStatus.DONE]: doctorOrAdmin,
    [AppointmentStatus.CANCELLED]: doctorOrAdmin,
  },
};

// Regra de autorizacao da transicao, ou null se o ciclo de vida nao a permite
export function transitionAuthority(
  from: AppointmentStatus,
  to: AppointmentStatus,
): TransitionAuthority | null {
  return TRANSITIONS[from]?.[to] ?? null;
}
