import { Doctor } from '../src/entities/Doctor';
import { MedicalRecord } from '../src/entities/MedicalRecord';
import { Role } from '../src/enums/Role';
import { DomainError } from '../src/errors/DomainError';
import { IAppointmentRepository } from '../src/repositories/ports/IAppointmentRepository';
import {
  IMedicalRecordRepository,
  NewMedicalRecordData,
} from '../src/repositories/ports/IMedicalRecordRepository';
import { DoctorService } from '../src/services/DoctorService';
import { MedicalRecordService } from '../src/services/MedicalRecordService';
import { PatientService } from '../src/services/PatientService';

// Factory evita carregar o modulo real, que le o config/env (importado pelo DoctorService)
jest.mock('../src/utils/hash', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

// Usuario 7 e o medico 3, que atendeu o paciente 10; usuario 8 e o medico 4, sem vinculo
const linkedDoctor = { id: 7, roles: [Role.DOCTOR] };
const unlinkedDoctor = { id: 8, roles: [Role.DOCTOR] };
const page = { page: 1, pageSize: 20 };

function record(data: NewMedicalRecordData, id = 5): MedicalRecord {
  return { id, ...data, createdAt: new Date('2026-10-13T11:25:00Z') } as MedicalRecord;
}

describe('MedicalRecordService', () => {
  let medicalRecordRepository: jest.Mocked<IMedicalRecordRepository>;
  let appointmentRepository: jest.Mocked<IAppointmentRepository>;
  let patientService: jest.Mocked<PatientService>;
  let doctorService: jest.Mocked<DoctorService>;
  let medicalRecordService: MedicalRecordService;

  beforeEach(() => {
    medicalRecordRepository = {
      create: jest.fn((data: NewMedicalRecordData) => Promise.resolve(record(data))),
      findPageByPatient: jest.fn().mockResolvedValue([[], 0]),
    };
    appointmentRepository = {
      hasCareLink: jest.fn((doctorId: number, patientId: number) =>
        Promise.resolve(doctorId === 3 && patientId === 10),
      ),
    } as unknown as jest.Mocked<IAppointmentRepository>;
    patientService = { findById: jest.fn() } as unknown as jest.Mocked<PatientService>;
    doctorService = {
      findByUserId: jest.fn((userId: number) =>
        Promise.resolve(({ 7: { id: 3 }, 8: { id: 4 } } as Record<number, Doctor>)[userId] ?? null),
      ),
    } as unknown as jest.Mocked<DoctorService>;

    medicalRecordService = new MedicalRecordService(
      medicalRecordRepository,
      appointmentRepository,
      patientService,
      doctorService,
    );
  });

  describe('create', () => {
    it('medico com vinculo escreve, como autor do registro', async () => {
      const result = await medicalRecordService.create(10, '  Dor lombar. ', linkedDoctor);

      expect(appointmentRepository.hasCareLink).toHaveBeenCalledWith(3, 10);
      expect(medicalRecordRepository.create).toHaveBeenCalledWith({
        patientId: 10,
        doctorId: 3,
        text: 'Dor lombar.',
      });
      expect(result.doctorId).toBe(3);
    });

    it('medico sem vinculo recebe ACESSO_NEGADO e nada e gravado', async () => {
      const result = medicalRecordService.create(10, 'Texto', unlinkedDoctor);

      await expect(result).rejects.toBeInstanceOf(DomainError);
      await expect(result).rejects.toMatchObject({ code: 'ACESSO_NEGADO' });
      expect(medicalRecordRepository.create).not.toHaveBeenCalled();
    });

    it('paciente inexistente gera 404 antes de checar o vinculo', async () => {
      patientService.findById.mockRejectedValue(
        new DomainError('RECURSO_NAO_ENCONTRADO', 'Paciente nao encontrado'),
      );

      await expect(medicalRecordService.create(99, 'Texto', linkedDoctor)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO',
      });
      expect(appointmentRepository.hasCareLink).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('medico com vinculo le o prontuario paginado', async () => {
      const records = [record({ patientId: 10, doctorId: 3, text: 'B' }, 6)];
      medicalRecordRepository.findPageByPatient.mockResolvedValue([records, 1]);

      const result = await medicalRecordService.list(10, page, linkedDoctor);

      expect(medicalRecordRepository.findPageByPatient).toHaveBeenCalledWith(10, page);
      expect(result).toEqual({
        data: records,
        meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
      });
    });

    it('medico sem vinculo nao le', async () => {
      await expect(medicalRecordService.list(10, page, unlinkedDoctor)).rejects.toMatchObject({
        code: 'ACESSO_NEGADO',
      });
      expect(medicalRecordRepository.findPageByPatient).not.toHaveBeenCalled();
    });
  });
});
