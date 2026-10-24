import { Appointment } from '../src/entities/Appointment';
import { WorkShift } from '../src/entities/WorkShift';
import { AppointmentStatus } from '../src/enums/AppointmentStatus';
import { DomainError } from '../src/errors/DomainError';
import {
  IAppointmentRepository,
  IAppointmentTransaction,
  NewAppointmentData,
} from '../src/repositories/ports/IAppointmentRepository';
import { IWorkScheduleRepository } from '../src/repositories/ports/IWorkScheduleRepository';
import { AppointmentService } from '../src/services/AppointmentService';
import { DoctorService } from '../src/services/DoctorService';
import { PatientService } from '../src/services/PatientService';

// Factory evita carregar o modulo real, que le o config/env (importado pelo DoctorService)
jest.mock('../src/utils/hash', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

// Terca-feira, 13/10/2026; Sao Paulo esta em -03:00
const TUESDAY_08_00 = new Date('2026-10-13T08:00:00-03:00');

function shift(weekDay: number, startTime: string, endTime: string, slot: number): WorkShift {
  const data = { weekDay, startTime, endTime, slotDurationMinutes: slot };
  return { id: 1, doctorId: 3, ...data } as WorkShift;
}

function persisted(data: NewAppointmentData): Appointment {
  return { id: 41, ...data, status: AppointmentStatus.SCHEDULED } as Appointment;
}

describe('AppointmentService', () => {
  let tx: jest.Mocked<IAppointmentTransaction>;
  let appointmentRepository: jest.Mocked<IAppointmentRepository>;
  let workScheduleRepository: jest.Mocked<IWorkScheduleRepository>;
  let doctorService: jest.Mocked<DoctorService>;
  let patientService: jest.Mocked<PatientService>;
  let appointmentService: AppointmentService;

  const notFound = (what: string) =>
    new DomainError('RECURSO_NAO_ENCONTRADO', `${what} nao encontrado`);

  beforeEach(() => {
    tx = {
      hasDoctorOverlap: jest.fn().mockResolvedValue(false),
      hasPatientOverlap: jest.fn().mockResolvedValue(false),
      create: jest.fn((data: NewAppointmentData) => Promise.resolve(persisted(data))),
    };
    // Duble do lock: so executa o callback com as operacoes acima
    appointmentRepository = {
      withDoctorLock: jest.fn((_doctorId, work) => work(tx)),
    } as jest.Mocked<IAppointmentRepository>;
    workScheduleRepository = {
      // Terca: manha com consultas de 30 min e tarde com consultas de 20 min
      findByDoctorId: jest
        .fn()
        .mockResolvedValue([
          shift(2, '08:00:00', '12:00:00', 30),
          shift(2, '14:00:00', '18:00:00', 20),
        ]),
      replaceForDoctor: jest.fn(),
    };
    doctorService = { findById: jest.fn() } as unknown as jest.Mocked<DoctorService>;
    patientService = { findById: jest.fn() } as unknown as jest.Mocked<PatientService>;

    appointmentService = new AppointmentService(
      appointmentRepository,
      workScheduleRepository,
      doctorService,
      patientService,
    );
  });

  function create(startsAt: Date = TUESDAY_08_00) {
    return appointmentService.create({ doctorId: 3, patientId: 10, startsAt });
  }

  describe('create', () => {
    it('grava a consulta com o fim calculado pela duracao do turno', async () => {
      const result = await create();

      expect(tx.create).toHaveBeenCalledWith({
        doctorId: 3,
        patientId: 10,
        startsAt: TUESDAY_08_00,
        endsAt: new Date('2026-10-13T11:30:00Z'),
      });
      expect(result.status).toBe(AppointmentStatus.SCHEDULED);
    });

    it('verifica conflitos e grava sob o lock do medico da consulta', async () => {
      await create();

      expect(appointmentRepository.withDoctorLock).toHaveBeenCalledTimes(1);
      expect(appointmentRepository.withDoctorLock).toHaveBeenCalledWith(3, expect.any(Function));
    });

    it('usa a duracao do turno em que o horario cai', async () => {
      await create(new Date('2026-10-13T14:40:00-03:00'));

      expect(tx.create).toHaveBeenCalledWith(
        expect.objectContaining({ endsAt: new Date('2026-10-13T18:00:00Z') }),
      );
    });

    it('lanca 404 quando o medico nao existe', async () => {
      doctorService.findById.mockRejectedValue(notFound('Medico'));

      await expect(create()).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
      expect(patientService.findById).not.toHaveBeenCalled();
      expect(tx.create).not.toHaveBeenCalled();
    });

    it('lanca 404 quando o paciente nao existe', async () => {
      patientService.findById.mockRejectedValue(notFound('Paciente'));

      await expect(create()).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
      expect(workScheduleRepository.findByDoctorId).not.toHaveBeenCalled();
      expect(tx.create).not.toHaveBeenCalled();
    });

    it.each([
      ['fora de qualquer turno', '2026-10-13T13:00:00-03:00'],
      ['em dia sem escala', '2026-10-14T08:00:00-03:00'],
      ['desalinhado da grade (08:20 em turno de 30 min)', '2026-10-13T08:20:00-03:00'],
      ['que nao cabe no fim do turno (11:45 em turno ate 12:00)', '2026-10-13T11:45:00-03:00'],
      ['com segundos fora da grade', '2026-10-13T08:00:30-03:00'],
    ])('lanca HORARIO_FORA_DA_ESCALA para horario %s', async (_case, startsAt) => {
      const result = create(new Date(startsAt));

      await expect(result).rejects.toBeInstanceOf(DomainError);
      await expect(result).rejects.toMatchObject({ code: 'HORARIO_FORA_DA_ESCALA' });
      expect(tx.create).not.toHaveBeenCalled();
    });

    it('compara com a escala na hora local, mesmo com startsAt em outro fuso', async () => {
      // 11:00Z = 08:00 em Sao Paulo
      await create(new Date('2026-10-13T11:00:00Z'));

      expect(tx.create).toHaveBeenCalled();
    });

    it('lanca HORARIO_INDISPONIVEL quando o medico ja tem consulta no periodo', async () => {
      tx.hasDoctorOverlap.mockResolvedValue(true);

      await expect(create()).rejects.toMatchObject({ code: 'HORARIO_INDISPONIVEL' });
      expect(tx.hasDoctorOverlap).toHaveBeenCalledWith(
        3,
        TUESDAY_08_00,
        new Date('2026-10-13T11:30:00Z'),
      );
      expect(tx.create).not.toHaveBeenCalled();
    });

    it('lanca PACIENTE_INDISPONIVEL quando o paciente ja tem consulta no periodo', async () => {
      tx.hasPatientOverlap.mockResolvedValue(true);

      await expect(create()).rejects.toMatchObject({ code: 'PACIENTE_INDISPONIVEL' });
      expect(tx.hasPatientOverlap).toHaveBeenCalledWith(
        10,
        TUESDAY_08_00,
        new Date('2026-10-13T11:30:00Z'),
      );
      expect(tx.create).not.toHaveBeenCalled();
    });
  });
});
