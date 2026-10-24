import { Appointment } from '../src/entities/Appointment';
import { WorkShift } from '../src/entities/WorkShift';
import { Doctor } from '../src/entities/Doctor';
import { AppointmentStatus } from '../src/enums/AppointmentStatus';
import { Role } from '../src/enums/Role';
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
      lockPatient: jest.fn().mockResolvedValue(undefined),
      hasDoctorOverlap: jest.fn().mockResolvedValue(false),
      hasPatientOverlap: jest.fn().mockResolvedValue(false),
      create: jest.fn((data: NewAppointmentData) => Promise.resolve(persisted(data))),
    };
    // Duble do lock: so executa o callback com as operacoes acima
    appointmentRepository = {
      withDoctorLock: jest.fn((_doctorId, work) => work(tx)),
      findById: jest.fn(),
      findPage: jest.fn().mockResolvedValue([[], 0]),
      updateStatus: jest.fn().mockResolvedValue(true),
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
    doctorService = {
      findById: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<DoctorService>;
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

  describe('ordem das validacoes e uso do lock', () => {
    it('valida existencia e escala fora do lock, sem abrir transacao quando falham', async () => {
      await expect(create(new Date('2026-10-13T13:00:00-03:00'))).rejects.toMatchObject({
        code: 'HORARIO_FORA_DA_ESCALA',
      });
      doctorService.findById.mockRejectedValueOnce(notFound('Medico'));
      await expect(create()).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });

      expect(appointmentRepository.withDoctorLock).not.toHaveBeenCalled();
    });

    it('responde 404 antes de olhar a escala, mesmo com horario invalido', async () => {
      patientService.findById.mockRejectedValue(notFound('Paciente'));

      await expect(create(new Date('2026-10-13T08:20:00-03:00'))).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO',
      });
    });

    it('trava o paciente antes de verificar os conflitos', async () => {
      await create();

      expect(tx.lockPatient).toHaveBeenCalledWith(10);
      const lockOrder = tx.lockPatient.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(tx.hasDoctorOverlap.mock.invocationCallOrder[0]);
      expect(lockOrder).toBeLessThan(tx.hasPatientOverlap.mock.invocationCallOrder[0]);
    });

    it('nao consulta o paciente nem grava quando o medico ja esta ocupado', async () => {
      tx.hasDoctorOverlap.mockResolvedValue(true);

      await expect(create()).rejects.toMatchObject({ code: 'HORARIO_INDISPONIVEL' });
      expect(tx.hasPatientOverlap).not.toHaveBeenCalled();
      expect(tx.create).not.toHaveBeenCalled();
    });

    it('responde HORARIO_INDISPONIVEL quando medico e paciente estao ocupados', async () => {
      tx.hasDoctorOverlap.mockResolvedValue(true);
      tx.hasPatientOverlap.mockResolvedValue(true);

      await expect(create()).rejects.toMatchObject({ code: 'HORARIO_INDISPONIVEL' });
    });

    it('faz as verificacoes de conflito dentro do callback do lock', async () => {
      // Lock que nao executa o callback: nenhuma verificacao pode acontecer fora dele
      const appointment = persisted({
        doctorId: 3,
        patientId: 10,
        startsAt: TUESDAY_08_00,
        endsAt: new Date('2026-10-13T11:30:00Z'),
      });
      appointmentRepository.withDoctorLock.mockResolvedValue(appointment);

      await create();

      expect(tx.lockPatient).not.toHaveBeenCalled();
      expect(tx.hasDoctorOverlap).not.toHaveBeenCalled();
      expect(tx.hasPatientOverlap).not.toHaveBeenCalled();
      expect(tx.create).not.toHaveBeenCalled();
    });

    it('propaga o erro da transacao sem engolir', async () => {
      const failure = new Error('conexao perdida');
      tx.create.mockRejectedValue(failure);

      await expect(create()).rejects.toBe(failure);
    });
  });

  describe('changeStatus', () => {
    // Medico 3 (usuario 7) e o medico da consulta; medico 4 (usuario 8) e outro
    const admin = { id: 1, roles: [Role.ADMIN] };
    const secretary = { id: 2, roles: [Role.SECRETARY] };
    const ownDoctor = { id: 7, roles: [Role.DOCTOR] };
    const otherDoctor = { id: 8, roles: [Role.DOCTOR] };

    const doctorsByUser: Record<number, Doctor> = {
      7: { id: 3 } as Doctor,
      8: { id: 4 } as Doctor,
    };

    function stored(status: AppointmentStatus): Appointment {
      const appointment = persisted({
        doctorId: 3,
        patientId: 10,
        startsAt: TUESDAY_08_00,
        endsAt: new Date('2026-10-13T11:30:00Z'),
      });
      return { ...appointment, status } as Appointment;
    }

    function changeStatus(to: AppointmentStatus, requester: { id: number; roles: Role[] }) {
      return appointmentService.changeStatus(41, to, requester);
    }

    beforeEach(() => {
      doctorService.findByUserId.mockImplementation((userId: number) =>
        Promise.resolve(doctorsByUser[userId] ?? null),
      );
    });

    it('o medico da consulta inicia o atendimento', async () => {
      appointmentRepository.findById.mockResolvedValue(stored(AppointmentStatus.SCHEDULED));

      const result = await changeStatus(AppointmentStatus.IN_PROGRESS, ownDoctor);

      expect(appointmentRepository.updateStatus).toHaveBeenCalledWith(
        41,
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.IN_PROGRESS,
      );
      expect(result.status).toBe(AppointmentStatus.IN_PROGRESS);
    });

    it('lanca 404 quando o agendamento nao existe', async () => {
      appointmentRepository.findById.mockResolvedValue(null);

      await expect(
        appointmentService.changeStatus(99, AppointmentStatus.CANCELLED, admin),
      ).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
    });

    it('lanca TRANSICAO_INVALIDA fora da tabela, antes de checar o perfil', async () => {
      appointmentRepository.findById.mockResolvedValue(stored(AppointmentStatus.DONE));

      await expect(changeStatus(AppointmentStatus.CANCELLED, secretary)).rejects.toMatchObject({
        code: 'TRANSICAO_INVALIDA',
      });
      expect(appointmentRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('lanca ACESSO_NEGADO para medico de outra consulta', async () => {
      appointmentRepository.findById.mockResolvedValue(stored(AppointmentStatus.SCHEDULED));

      await expect(changeStatus(AppointmentStatus.IN_PROGRESS, otherDoctor)).rejects.toMatchObject({
        code: 'ACESSO_NEGADO',
      });
      expect(appointmentRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('lanca TRANSICAO_INVALIDA quando outra requisicao mudou o status antes', async () => {
      appointmentRepository.findById.mockResolvedValue(stored(AppointmentStatus.SCHEDULED));
      appointmentRepository.updateStatus.mockResolvedValue(false);

      await expect(changeStatus(AppointmentStatus.CANCELLED, admin)).rejects.toMatchObject({
        code: 'TRANSICAO_INVALIDA',
      });
    });
  });

  describe('list', () => {
    const page = { page: 1, pageSize: 20 };

    it('medico sem admin tem o doctorId forcado para o dele', async () => {
      doctorService.findByUserId.mockResolvedValue({ id: 3 } as Doctor);

      await appointmentService.list({ ...page, doctorId: 4 }, { id: 7, roles: [Role.DOCTOR] });

      expect(doctorService.findByUserId).toHaveBeenCalledWith(7);
      expect(appointmentRepository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ doctorId: 3 }),
      );
    });

    it('admin e secretary filtram pelo doctorId pedido', async () => {
      await appointmentService.list({ ...page, doctorId: 4 }, { id: 1, roles: [Role.ADMIN] });
      await appointmentService.list({ ...page }, { id: 2, roles: [Role.SECRETARY] });

      expect(appointmentRepository.findPage).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ doctorId: 4 }),
      );
      expect(appointmentRepository.findPage).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ doctorId: undefined }),
      );
      expect(doctorService.findByUserId).not.toHaveBeenCalled();
    });

    it('converte from e to em dias locais inteiros, com o fim exclusivo', async () => {
      await appointmentService.list(
        { ...page, from: '2026-10-12', to: '2026-10-16', status: AppointmentStatus.SCHEDULED },
        { id: 1, roles: [Role.ADMIN] },
      );

      expect(appointmentRepository.findPage).toHaveBeenCalledWith({
        ...page,
        doctorId: undefined,
        patientId: undefined,
        status: AppointmentStatus.SCHEDULED,
        startsFrom: new Date('2026-10-12T03:00:00Z'),
        startsBefore: new Date('2026-10-17T03:00:00Z'),
      });
    });

    it('recusa from posterior a to', async () => {
      await expect(
        appointmentService.list(
          { ...page, from: '2026-10-16', to: '2026-10-12' },
          { id: 1, roles: [Role.ADMIN] },
        ),
      ).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
    });
  });
});
