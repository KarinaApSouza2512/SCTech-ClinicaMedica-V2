import { AuthService } from '../src/services/AuthService';
import { UserService } from '../src/services/UserService';
import { User } from '../src/entities/User';
import { Role } from '../src/enums/Role';
import { comparePassword } from '../src/utils/hash';
import { signAccessToken } from '../src/utils/jwt';

// Factories evitam carregar os modulos reais, que leem o config/env
jest.mock('../src/utils/hash', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));
jest.mock('../src/utils/jwt', () => ({
  signAccessToken: jest.fn(),
  verifyAccessToken: jest.fn(),
}));

const comparePasswordMock = comparePassword as jest.Mock;
const signAccessTokenMock = signAccessToken as jest.Mock;

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    name: 'Ana',
    email: 'ana@x.com',
    password: 'hashed-password',
    role: Role.ATTENDANT,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  } as User;
}

describe('AuthService', () => {
  let userService: jest.Mocked<UserService>;
  let authService: AuthService;

  beforeEach(() => {
    userService = {
      create: jest.fn(),
      toPublic: jest.fn(),
      findById: jest.fn(),
      findByEmailWithPassword: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    authService = new AuthService(userService);
  });

  describe('register', () => {
    it('cria o usuario e retorna a versao publica dele', async () => {
      const input = { name: 'Ana', email: 'ana@x.com', password: '123456' };
      const createdUser = buildUser();
      const publicUser = { id: '1', name: 'Ana', email: 'ana@x.com', role: Role.ATTENDANT, createdAt: createdUser.createdAt };

      userService.create.mockResolvedValue(createdUser);
      userService.toPublic.mockReturnValue(publicUser);

      const result = await authService.register(input);

      expect(userService.create).toHaveBeenCalledWith(input);
      expect(userService.toPublic).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(publicUser);
    });
  });

  describe('login', () => {
    it('retorna token e usuario publico quando as credenciais sao validas', async () => {
      const user = buildUser();
      const publicUser = { id: '1', name: 'Ana', email: 'ana@x.com', role: Role.ATTENDANT, createdAt: user.createdAt };

      userService.findByEmailWithPassword.mockResolvedValue(user);
      comparePasswordMock.mockResolvedValue(true);
      signAccessTokenMock.mockReturnValue('fake-token');
      userService.toPublic.mockReturnValue(publicUser);

      const result = await authService.login({ email: 'ana@x.com', password: '123456' });

      expect(comparePasswordMock).toHaveBeenCalledWith('123456', user.password);
      expect(signAccessTokenMock).toHaveBeenCalledWith({ sub: user.id, email: user.email, role: user.role });
      expect(result).toEqual({ token: 'fake-token', user: publicUser });
    });

    it('lanca erro generico quando o usuario nao existe', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login({ email: 'inexistente@x.com', password: '123456' }))
        .rejects.toMatchObject({ statusCode: 401, message: 'Credenciais invalidas' });

      expect(comparePasswordMock).not.toHaveBeenCalled();
    });

    it('lanca o mesmo erro generico quando a senha esta incorreta', async () => {
      const user = buildUser();
      userService.findByEmailWithPassword.mockResolvedValue(user);
      comparePasswordMock.mockResolvedValue(false);

      await expect(authService.login({ email: user.email, password: 'senha-errada' }))
        .rejects.toMatchObject({ statusCode: 401, message: 'Credenciais invalidas' });

      expect(signAccessTokenMock).not.toHaveBeenCalled();
    });
  });
});
