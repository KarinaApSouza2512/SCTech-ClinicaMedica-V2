import { Inject, Injectable } from '@nestjs/common';
import { WorkShift } from '../entities/WorkShift';
import { DomainError } from '../errors/DomainError';
import type {
  IWorkScheduleRepository,
  ShiftData,
} from '../repositories/ports/IWorkScheduleRepository';
import { WORK_SCHEDULE_REPOSITORY } from '../repositories/ports/IWorkScheduleRepository';
import { timeToMinutes } from '../utils/time';
import { DoctorService } from './DoctorService';

// Formato (dia 0..6, HH:MM, duracao > 0) ja vem validado pelo DTO
function assertValidRange(shift: ShiftData): void {
  if (timeToMinutes(shift.startTime) >= timeToMinutes(shift.endTime)) {
    throw new DomainError(
      'DADOS_INVALIDOS',
      `Turno ${shift.startTime}-${shift.endTime}: startTime deve ser menor que endTime`,
    );
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
    await this.doctorService.findById(doctorId);

    return this.workScheduleRepository.replaceForDoctor(doctorId, shifts);
  }
}
