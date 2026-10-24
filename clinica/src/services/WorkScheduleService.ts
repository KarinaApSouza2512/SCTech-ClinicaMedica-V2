import { Inject, Injectable } from '@nestjs/common';
import { WorkShift } from '../entities/WorkShift';
import { DomainError } from '../errors/DomainError';
import type {
  IWorkScheduleRepository,
  ShiftData,
} from '../repositories/ports/IWorkScheduleRepository';
import { WORK_SCHEDULE_REPOSITORY } from '../repositories/ports/IWorkScheduleRepository';
import { MinuteRange, rangesOverlap, timeToMinutes } from '../utils/time';
import { DoctorService } from './DoctorService';

function formatShift(shift: ShiftData): string {
  return `${shift.startTime}-${shift.endTime}`;
}

function toRange(shift: ShiftData): MinuteRange {
  return { start: timeToMinutes(shift.startTime), end: timeToMinutes(shift.endTime) };
}

// Formato (dia 0..6, HH:MM, duracao > 0) ja vem validado pelo DTO
function assertValidRange(shift: ShiftData): void {
  const range = toRange(shift);

  if (range.start >= range.end) {
    throw new DomainError(
      'DADOS_INVALIDOS',
      `Turno ${formatShift(shift)}: startTime deve ser menor que endTime`,
    );
  }
}

// Ordenados por dia e inicio, basta comparar cada turno com o seguinte do mesmo dia
function assertNoOverlap(shifts: ShiftData[]): void {
  const sorted = [...shifts].sort(
    (a, b) => a.weekDay - b.weekDay || timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];

    const sameDay = previous.weekDay === current.weekDay;

    if (sameDay && rangesOverlap(toRange(previous), toRange(current))) {
      const pair = `${formatShift(previous)} e ${formatShift(current)}`;
      throw new DomainError(
        'DADOS_INVALIDOS',
        `Turnos sobrepostos no dia ${current.weekDay}: ${pair}`,
      );
    }
  }
}

@Injectable()
export class WorkScheduleService {
  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
    private readonly doctorService: DoctorService,
  ) {}

  async findByDoctorId(doctorId: number): Promise<WorkShift[]> {
    await this.doctorService.findById(doctorId);
    return this.workScheduleRepository.findByDoctorId(doctorId);
  }

  // Substitui a escala inteira; lista vazia deixa o medico sem escala
  async replace(doctorId: number, shifts: ShiftData[]): Promise<WorkShift[]> {
    shifts.forEach(assertValidRange);
    assertNoOverlap(shifts);
    await this.doctorService.findById(doctorId);

    return this.workScheduleRepository.replaceForDoctor(doctorId, shifts);
  }
}
