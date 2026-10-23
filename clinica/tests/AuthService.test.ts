import { AuthService } from '../src/services/AuthService';
import { UserService } from '../src/services/UserService';
import { User } from '../src/entities/User';
import { Role } from '../src/enums/Role';
import { DomainError } from '../src/errors/DomainError';
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
    it('retorna o accessToken assinado com id e perfis quando as credenciais sao validas', async () => {
      const user = buildUser({ roles: [Role.DOCTOR, Role.ADMIN] });
      userService.findByEmailWithPassword.mockResolvedValue(user);
      comparePasswordMock.mockResolvedValue(true);
      signAccessTokenMock.mockReturnValue('fake-token');

      const result = await authService.login({ email: 'ana@x.com', password: '123456' });

      expect(userService.findByEmailWithPassword).toHaveBeenCalledWith('ana@x.com');
      expect(signAccessTokenMock).toHaveBeenCalledWith({
        sub: 1,
        roles: [Role.DOCTOR, Role.ADMIN],
      });
      expect(result).toEqual({ accessToken: 'fake-token' });
    });

    it('compara a senha digitada com o hash salvo, e nao com texto puro', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(buildUser());
      comparePasswordMock.mockResolvedValue(true);

      await authService.login({ email: 'ana@x.com', password: 'senha-digitada' });

      expect(comparePasswordMock).toHaveBeenCalledTimes(1);
      expect(comparePasswordMock).toHaveBeenCalledWith('senha-digitada', 'hashed-password');
    });

    it('lanca CREDENCIAIS_INVALIDAS quando o e-mail nao existe', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(null);

      const result = authService.login({ email: 'inexistente@x.com', password: '123456' });

      await expect(result).rejects.toBeInstanceOf(DomainError);
      await expect(result).rejects.toMatchObject({ code: 'CREDENCIAIS_INVALIDAS' });
      expect(comparePasswordMock).not.toHaveBeenCalled();
      expect(signAccessTokenMock).not.toHaveBeenCalled();
    });

    it('lanca o mesmo erro quando a senha esta incorreta', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(buildUser());
      comparePasswordMock.mockResolvedValue(false);

      const result = authService.login({ email: 'ana@x.com', password: 'senha-errada' });

      // Mesmo codigo e mesma mensagem: nao revela qual dos dois falhou
      await expect(result).rejects.toMatchObject({
        code: 'CREDENCIAIS_INVALIDAS',
        message: 'Credenciais invalidas',
      });
      expect(comparePasswordMock).toHaveBeenCalledWith('senha-errada', 'hashed-password');
      expect(signAccessTokenMock).not.toHaveBeenCalled();
    });
  });
});
