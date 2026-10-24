import { Inject, Injectable } from '@nestjs/common';
import { Appointment } from '../entities/Appointment';
import { AppointmentStatus } from '../enums/AppointmentStatus';
import { Role } from '../enums/Role';
import { DomainError } from '../errors/DomainError';
import type { IAppointmentRepository } from '../repositories/ports/IAppointmentRepository';
import { APPOINTMENT_REPOSITORY } from '../repositories/ports/IAppointmentRepository';
import type { IWorkScheduleRepository } from '../repositories/ports/IWorkScheduleRepository';
import { WORK_SCHEDULE_REPOSITORY } from '../repositories/ports/IWorkScheduleRepository';
import type { Requester } from '../types/Requester';
import { clinicDayStart, nextDay, toClinicTime } from '../utils/clinicTime';
import { buildPage, Paginated, PaginationParams } from '../utils/pagination';
import { findShiftForSlot, transitionAuthority } from './AppointmentRules';
import { DoctorService } from './DoctorService';
import { PatientService } from './PatientService';

export interface CreateAppointmentInput {
  doctorId: number;
  patientId: number;
  startsAt: Date;
}

export interface ListAppointmentsInput extends PaginationParams {
  doctorId?: number;
  patientId?: number;
  status?: AppointmentStatus;
  // Dias locais 'YYYY-MM-DD', inclusivos
  from?: string;
  to?: string;
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
      // O paciente tambem e travado, senao dois medicos o agendariam no mesmo horario.
      // A ordem e sempre medico e depois paciente, entao duas transacoes nunca esperam
      // uma pela outra em ciclo (sem deadlock).
      await tx.lockPatient(input.patientId);

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

  // Ordem do contrato: 404, depois 422 (ciclo de vida), depois 403 (autoridade)
  async changeStatus(
    id: number,
    to: AppointmentStatus,
    requester: Requester,
  ): Promise<Appointment> {
    const appointment = await this.findExisting(id);
    const from = appointment.status;
    const authority = transitionAuthority(from, to);

    if (!authority) {
      throw new DomainError('TRANSICAO_INVALIDA', `Transicao de ${from} para ${to} nao permitida`);
    }

    const allowed = authority({
      isAdmin: requester.roles.includes(Role.ADMIN),
      isSecretary: requester.roles.includes(Role.SECRETARY),
      isAppointmentDoctor: (await this.ownDoctorId(requester)) === appointment.doctorId,
    });

    if (!allowed) {
      throw new DomainError('ACESSO_NEGADO', 'Perfil sem permissao para esta mudanca de status');
    }

    // Sem lock: a gravacao so acontece se o status ainda for o lido acima
    if (!(await this.appointmentRepository.updateStatus(id, from, to))) {
      throw new DomainError(
        'TRANSICAO_INVALIDA',
        'O status do agendamento mudou; consulte de novo',
      );
    }

    appointment.status = to;
    return appointment;
  }

  // Medico sem admin so enxerga os proprios agendamentos, seja qual for o doctorId pedido
  async list(input: ListAppointmentsInput, requester: Requester): Promise<Paginated<Appointment>> {
    if (input.from && input.to && input.from > input.to) {
      throw new DomainError('DADOS_INVALIDOS', 'from deve ser anterior ou igual a to');
    }

    const params = { page: input.page, pageSize: input.pageSize };
    let doctorId = input.doctorId;

    if (this.isDoctorOnly(requester)) {
      const ownId = await this.ownDoctorId(requester);
      if (ownId === null) {
        return buildPage([], 0, params);
      }
      doctorId = ownId;
    }

    const [appointments, total] = await this.appointmentRepository.findPage({
      ...params,
      doctorId,
      patientId: input.patientId,
      status: input.status,
      startsFrom: input.from ? clinicDayStart(input.from) : undefined,
      startsBefore: input.to ? clinicDayStart(nextDay(input.to)) : undefined,
    });

    return buildPage(appointments, total, params);
  }

  private isDoctorOnly(requester: Requester): boolean {
    return requester.roles.includes(Role.DOCTOR) && !requester.roles.includes(Role.ADMIN);
  }

  private async findExisting(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Agendamento nao encontrado');
    }

    return appointment;
  }

  // Id do medico ligado ao usuario, ou null se ele nao tem perfil doctor ou cadastro de medico
  private async ownDoctorId(requester: Requester): Promise<number | null> {
    if (!requester.roles.includes(Role.DOCTOR)) {
      return null;
    }

    const doctor = await this.doctorService.findByUserId(requester.id);
    return doctor?.id ?? null;
  }
}
