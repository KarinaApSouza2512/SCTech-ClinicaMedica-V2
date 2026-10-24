import { Inject, Injectable } from '@nestjs/common';
import { Appointment } from '../entities/Appointment';
import { DomainError } from '../errors/DomainError';
import type { IAppointmentRepository } from '../repositories/ports/IAppointmentRepository';
import { APPOINTMENT_REPOSITORY } from '../repositories/ports/IAppointmentRepository';
import type { IWorkScheduleRepository } from '../repositories/ports/IWorkScheduleRepository';
import { WORK_SCHEDULE_REPOSITORY } from '../repositories/ports/IWorkScheduleRepository';
import { toClinicTime } from '../utils/clinicTime';
import { findShiftForSlot } from './AppointmentRules';
import { DoctorService } from './DoctorService';
import { PatientService } from './PatientService';

export interface CreateAppointmentInput {
  doctorId: number;
  patientId: number;
  startsAt: Date;
}

const MINUTE_MS = 60_000;

@Injectable()
export class AppointmentService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository,
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
    private readonly doctorService: DoctorService,
    private readonly patientService: PatientService,
  ) {}

  async create(input: CreateAppointmentInput): Promise<Appointment> {
    // 1. medico e paciente existem (404)
    await this.doctorService.findById(input.doctorId);
    await this.patientService.findById(input.patientId);

    // 2 a 4. o horario existe na escala, na hora local da clinica (422)
    const shifts = await this.workScheduleRepository.findByDoctorId(input.doctorId);
    const { weekDay, minutesOfDay } = toClinicTime(input.startsAt);
    const shift = findShiftForSlot(shifts, weekDay, minutesOfDay);

    if (!shift) {
      throw new DomainError('HORARIO_FORA_DA_ESCALA', 'Horario nao existe na escala do medico');
    }

    // O fim e calculado agora e gravado: mudar a escala depois nao altera a consulta
    const endsAt = new Date(input.startsAt.getTime() + shift.slotDurationMinutes * MINUTE_MS);

    return this.appointmentRepository.create({
      doctorId: input.doctorId,
      patientId: input.patientId,
      startsAt: input.startsAt,
      endsAt,
    });
  }
}
