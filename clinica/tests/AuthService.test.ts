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
    id: 1,
    name: 'Ana',
    email: 'ana@x.com',
    password: 'hashed-password',
    roles: [Role.SECRETARY],
    createdAt: new Date('2024-01-01'),
    ...overrides,
  } as User;
}

describe('AuthService', () => {
  let userService: jest.Mocked<UserService>;
  let authService: AuthService;

  beforeEach(() => {
    userService = {
      findByEmailWithPassword: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    authService = new AuthService(userService);
  });

  describe('login', () => {
    it('retorna o accessToken quando as credenciais sao validas', async () => {
      const user = buildUser();

      userService.findByEmailWithPassword.mockResolvedValue(user);
      comparePasswordMock.mockResolvedValue(true);
      signAccessTokenMock.mockReturnValue('fake-token');

      const result = await authService.login({ email: 'ana@x.com', password: '123456' });

      expect(comparePasswordMock).toHaveBeenCalledWith('123456', user.password);
      expect(signAccessTokenMock).toHaveBeenCalledWith({ sub: user.id, roles: user.roles });
      expect(result).toEqual({ accessToken: 'fake-token' });
    });

    it('lanca erro generico quando o usuario nao existe', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login({ email: 'inexistente@x.com', password: '123456' }))
        .rejects.toMatchObject({ code: 'CREDENCIAIS_INVALIDAS' });

      expect(comparePasswordMock).not.toHaveBeenCalled();
    });

    it('lanca o mesmo erro generico quando a senha esta incorreta', async () => {
      const user = buildUser();
      userService.findByEmailWithPassword.mockResolvedValue(user);
      comparePasswordMock.mockResolvedValue(false);

      await expect(authService.login({ email: user.email, password: 'senha-errada' }))
        .rejects.toMatchObject({ code: 'CREDENCIAIS_INVALIDAS' });

      expect(signAccessTokenMock).not.toHaveBeenCalled();
    });
  });
});
