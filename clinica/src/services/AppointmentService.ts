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
    const startsAt = input.startsAt;
    const endsAt = new Date(startsAt.getTime() + shift.slotDurationMinutes * MINUTE_MS);

    // 5, 6 e a gravacao sob o lock do medico: duas requisicoes simultaneas nao gravam as duas
    return this.appointmentRepository.withDoctorLock(input.doctorId, async (tx) => {
      // 5. medico livre no periodo (409)
      if (await tx.hasDoctorOverlap(input.doctorId, startsAt, endsAt)) {
        throw new DomainError('HORARIO_INDISPONIVEL', 'Medico ja tem consulta nesse horario');
      }

      // 6. paciente livre no periodo (409)
      if (await tx.hasPatientOverlap(input.patientId, startsAt, endsAt)) {
        throw new DomainError('PACIENTE_INDISPONIVEL', 'Paciente ja tem consulta nesse horario');
      }

      return tx.create({ doctorId: input.doctorId, patientId: input.patientId, startsAt, endsAt });
    });
  }
}
