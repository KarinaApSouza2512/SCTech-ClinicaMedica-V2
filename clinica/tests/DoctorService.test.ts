import { Doctor } from '../src/entities/Doctor';
import { User } from '../src/entities/User';
import { Role } from '../src/enums/Role';
import { DomainError } from '../src/errors/DomainError';
import { IDoctorRepository } from '../src/repositories/ports/IDoctorRepository';
import { IUserRepository } from '../src/repositories/ports/IUserRepository';
import { DoctorService } from '../src/services/DoctorService';
import { hashPassword } from '../src/utils/hash';

// Factory evita carregar o modulo real, que le o config/env
jest.mock('../src/utils/hash', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

const hashPasswordMock = hashPassword as jest.Mock;

function buildDoctor(overrides: Partial<Doctor> = {}): Doctor {
  const user = {
    id: 7,
    name: 'Dra. Helena Souza',
    email: 'helena@medclinic.com',
    roles: [Role.DOCTOR],
    createdAt: new Date('2024-01-01'),
  } as User;

  return {
    id: 3,
    crm: 'CRM-SC-54321',
    userId: user.id,
    user,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

const validInput = {
  name: 'Dra. Helena Souza',
  email: 'helena@medclinic.com',
  password: 'SenhaForte@123',
  crm: 'CRM-SC-54321',
};

describe('DoctorService', () => {
  let doctorRepository: jest.Mocked<IDoctorRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let doctorService: DoctorService;

  beforeEach(() => {
    doctorRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByCrm: jest.fn(),
      findPage: jest.fn(),
      createWithUser: jest.fn(),
    };
    userRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
    };

    doctorService = new DoctorService(doctorRepository, userRepository);
  });

  describe('create', () => {
    it('cria usuario e medico numa unica chamada, com a senha em hash', async () => {
      const doctor = buildDoctor();
      userRepository.findByEmail.mockResolvedValue(null);
      doctorRepository.findByCrm.mockResolvedValue(null);
      hashPasswordMock.mockResolvedValue('hashed-password');
      doctorRepository.createWithUser.mockResolvedValue(doctor);

      const result = await doctorService.create(validInput);

      expect(hashPasswordMock).toHaveBeenCalledWith('SenhaForte@123');
      expect(doctorRepository.createWithUser).toHaveBeenCalledTimes(1);
      expect(doctorRepository.createWithUser).toHaveBeenCalledWith({
        name: 'Dra. Helena Souza',
        email: 'helena@medclinic.com',
        password: 'hashed-password',
        crm: 'CRM-SC-54321',
      });
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(result).toBe(doctor);
    });

    it('normaliza e-mail, nome e CRM antes de verificar e gravar', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      doctorRepository.findByCrm.mockResolvedValue(null);
      hashPasswordMock.mockResolvedValue('hashed-password');
      doctorRepository.createWithUser.mockResolvedValue(buildDoctor());

      await doctorService.create({
        name: '  Dra. Helena Souza ',
        email: ' Helena@MedClinic.com ',
        password: 'SenhaForte@123',
        crm: ' CRM-SC-54321 ',
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith('helena@medclinic.com');
      expect(doctorRepository.findByCrm).toHaveBeenCalledWith('CRM-SC-54321');
      expect(doctorRepository.createWithUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Dra. Helena Souza',
          email: 'helena@medclinic.com',
          crm: 'CRM-SC-54321',
        }),
      );
    });
  });

  describe('create com conflito', () => {
    it('lanca EMAIL_JA_CADASTRADO e nao grava nada quando o e-mail ja existe', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 1 } as User);

      const result = doctorService.create(validInput);

      await expect(result).rejects.toBeInstanceOf(DomainError);
      await expect(result).rejects.toMatchObject({ code: 'EMAIL_JA_CADASTRADO' });
      expect(hashPasswordMock).not.toHaveBeenCalled();
      expect(doctorRepository.createWithUser).not.toHaveBeenCalled();
    });

    it('lanca CRM_JA_CADASTRADO e nao cria o usuario quando o CRM ja existe', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      doctorRepository.findByCrm.mockResolvedValue(buildDoctor());

      await expect(
        doctorService.create({ ...validInput, email: 'novo@medclinic.com' }),
      ).rejects.toMatchObject({ code: 'CRM_JA_CADASTRADO' });
      expect(doctorRepository.createWithUser).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('propaga o erro do repositorio quando a constraint barra uma corrida', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      doctorRepository.findByCrm.mockResolvedValue(null);
      hashPasswordMock.mockResolvedValue('hashed-password');
      // Outro cadastro gravou o mesmo CRM entre a verificacao e a transacao
      const conflict = new DomainError('CRM_JA_CADASTRADO', 'CRM ja cadastrado');
      doctorRepository.createWithUser.mockRejectedValue(conflict);

      await expect(doctorService.create(validInput)).rejects.toBe(conflict);
    });
  });

  describe('list', () => {
    it('devolve a pagina com a meta calculada a partir do total', async () => {
      const doctors = [buildDoctor({ id: 1 }), buildDoctor({ id: 2 })];
      doctorRepository.findPage.mockResolvedValue([doctors, 3]);

      const result = await doctorService.list({ page: 1, pageSize: 2 });

      expect(doctorRepository.findPage).toHaveBeenCalledWith({
        page: 1,
        pageSize: 2,
        name: undefined,
      });
      expect(result).toEqual({
        data: doctors,
        meta: { total: 3, page: 1, pageSize: 2, totalPages: 2 },
      });
    });

    it('repassa o filtro de nome sem espacos e ignora nome em branco', async () => {
      doctorRepository.findPage.mockResolvedValue([[], 0]);

      await doctorService.list({ page: 1, pageSize: 20, name: '  hel ' });
      await doctorService.list({ page: 1, pageSize: 20, name: '   ' });

      expect(doctorRepository.findPage).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ name: 'hel' }),
      );
      expect(doctorRepository.findPage).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ name: undefined }),
      );
    });
  });

  describe('findById', () => {
    it('retorna o medico quando ele existe', async () => {
      const doctor = buildDoctor();
      doctorRepository.findById.mockResolvedValue(doctor);

      await expect(doctorService.findById(3)).resolves.toBe(doctor);
      expect(doctorRepository.findById).toHaveBeenCalledWith(3);
    });

    it('lanca RECURSO_NAO_ENCONTRADO quando o medico nao existe', async () => {
      doctorRepository.findById.mockResolvedValue(null);

      await expect(doctorService.findById(99)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO',
      });
    });
  });

  describe('findByUserId', () => {
    it('busca o medico pelo usuario e devolve null quando nao ha vinculo', async () => {
      const doctor = buildDoctor();
      doctorRepository.findByUserId.mockResolvedValueOnce(doctor).mockResolvedValueOnce(null);

      await expect(doctorService.findByUserId(7)).resolves.toBe(doctor);
      await expect(doctorService.findByUserId(1)).resolves.toBeNull();
      expect(doctorRepository.findByUserId).toHaveBeenCalledWith(7);
    });
  });
});
