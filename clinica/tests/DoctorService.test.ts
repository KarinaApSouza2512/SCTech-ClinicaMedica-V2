import { Doctor } from '../src/entities/Doctor';
import { User } from '../src/entities/User';
import { Role } from '../src/enums/Role';
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
      findByCrm: jest.fn(),
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
});
