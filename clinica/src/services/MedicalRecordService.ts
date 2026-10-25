import { Inject, Injectable } from '@nestjs/common';
import { Doctor } from '../entities/Doctor';
import { MedicalRecord } from '../entities/MedicalRecord';
import { Role } from '../enums/Role';
import { DomainError } from '../errors/DomainError';
import type { IAppointmentRepository } from '../repositories/ports/IAppointmentRepository';
import { APPOINTMENT_REPOSITORY } from '../repositories/ports/IAppointmentRepository';
import type { IMedicalRecordRepository } from '../repositories/ports/IMedicalRecordRepository';
import { MEDICAL_RECORD_REPOSITORY } from '../repositories/ports/IMedicalRecordRepository';
import type { Requester } from '../types/Requester';
import { buildPage, Paginated, PaginationParams } from '../utils/pagination';
import { DoctorService } from './DoctorService';
import { PatientService } from './PatientService';

// Acesso por posse (RN14): o perfil sozinho nao basta, precisa do vinculo de atendimento
@Injectable()
export class MedicalRecordService {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY)
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository,
    private readonly patientService: PatientService,
    private readonly doctorService: DoctorService,
  ) {}

  // O autor e o medico do token; nenhum doctorId da requisicao chega aqui
  async create(patientId: number, text: string, requester: Requester): Promise<MedicalRecord> {
    await this.patientService.findById(patientId);
    const doctor = await this.linkedDoctor(patientId, requester);

    return this.medicalRecordRepository.create({
      patientId,
      doctorId: doctor.id,
      text: text.trim(),
    });
  }

  async list(
    patientId: number,
    page: PaginationParams,
    requester: Requester,
  ): Promise<Paginated<MedicalRecord>> {
    await this.patientService.findById(patientId);

    // Admin le para auditoria, sem vinculo; os demais precisam ter atendido o paciente
    if (!requester.roles.includes(Role.ADMIN)) {
      await this.linkedDoctor(patientId, requester);
    }

    const params = { page: page.page, pageSize: page.pageSize };
    const [records, total] = await this.medicalRecordRepository.findPageByPatient(
      patientId,
      params,
    );

    return buildPage(records, total, params);
  }

  // Medico do usuario logado, desde que ele ja tenha atendido o paciente
  private async linkedDoctor(patientId: number, requester: Requester): Promise<Doctor> {
    const doctor = requester.roles.includes(Role.DOCTOR)
      ? await this.doctorService.findByUserId(requester.id)
      : null;

    if (!doctor || !(await this.appointmentRepository.hasCareLink(doctor.id, patientId))) {
      throw new DomainError('ACESSO_NEGADO', 'Medico sem vinculo de atendimento com o paciente');
    }

    return doctor;
  }
}
