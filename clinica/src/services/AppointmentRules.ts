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
