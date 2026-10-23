import { User } from '../src/entities/User';
import { Role } from '../src/enums/Role';
import { UserRepository } from '../src/repositories/UserRepository';
import { UserService } from '../src/services/UserService';
import { hashPassword } from '../src/utils/hash';

// Factory evita carregar o modulo real, que le o config/env
jest.mock('../src/utils/hash', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

const hashPasswordMock = hashPassword as jest.Mock;

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    name: 'Ana',
    email: 'ana@x.com',
    password: 'hashed-password',
    roles: [Role.SECRETARY],
    createdAt: new Date('2024-01-01'),
    ...overrides,
  } as User;
}

describe('UserService', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let userService: UserService;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    userService = new UserService(userRepository);
  });

  describe('create', () => {
    it('lanca conflito quando o e-mail ja esta cadastrado', async () => {
      userRepository.findByEmail.mockResolvedValue(buildUser());

      await expect(
        userService.create({ name: 'Ana', email: 'ana@x.com', password: '12345678' }),
      ).rejects.toMatchObject({ code: 'EMAIL_JA_CADASTRADO' });

      expect(hashPasswordMock).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('normaliza o e-mail, guarda a senha com hash e usa secretary como perfil padrao', async () => {
      const entity = buildUser();
      userRepository.findByEmail.mockResolvedValue(null);
      hashPasswordMock.mockResolvedValue('hashed-password');
      userRepository.create.mockReturnValue(entity);
      userRepository.save.mockResolvedValue(entity);

      const result = await userService.create({
        name: '  Ana  ',
        email: '  Ana@X.COM ',
        password: '12345678',
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith('ana@x.com');
      expect(hashPasswordMock).toHaveBeenCalledWith('12345678');
      expect(userRepository.create).toHaveBeenCalledWith({
        name: 'Ana',
        email: 'ana@x.com',
        password: 'hashed-password',
        roles: [Role.SECRETARY],
      });
      expect(userRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(entity);
    });

    it('mantem os perfis informados sem repeticao', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      hashPasswordMock.mockResolvedValue('hashed-password');
      userRepository.create.mockReturnValue(buildUser({ roles: [Role.DOCTOR, Role.ADMIN] }));

      await userService.create({
        name: 'Bruno',
        email: 'bruno@x.com',
        password: '12345678',
        roles: [Role.DOCTOR, Role.ADMIN, Role.DOCTOR],
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ roles: [Role.DOCTOR, Role.ADMIN] }),
      );
    });
  });

  describe('findById', () => {
    it('lanca nao encontrado quando o usuario nao existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.findById('99')).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO',
      });
    });

    it('retorna o usuario quando ele existe', async () => {
      const user = buildUser();
      userRepository.findById.mockResolvedValue(user);

      await expect(userService.findById('1')).resolves.toBe(user);
      expect(userRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('findByEmailWithPassword', () => {
    it('normaliza o e-mail antes de buscar', async () => {
      const user = buildUser();
      userRepository.findByEmailWithPassword.mockResolvedValue(user);

      const result = await userService.findByEmailWithPassword('  ANA@x.com ');

      expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith('ana@x.com');
      expect(result).toBe(user);
    });
  });

  describe('toPublic', () => {
    it('devolve os dados publicos sem a senha', () => {
      const user = buildUser();

      const result = userService.toPublic(user);

      expect(result).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        createdAt: user.createdAt,
      });
      expect(result).not.toHaveProperty('password');
    });
  });
});
