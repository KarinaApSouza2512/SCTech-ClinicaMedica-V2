import jwt from 'jsonwebtoken';
import { Role } from '../src/enums/Role';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt';

// Configuracao fixa: o teste nao depende do .env
jest.mock('../src/config/env', () => ({
  env: { jwt: { secret: 'segredo-de-teste', expiresIn: '1h' } },
}));

describe('jwt', () => {
  it('assina e le de volta o id e os perfis', () => {
    const token = signAccessToken({ sub: 7, roles: [Role.DOCTOR] });

    expect(verifyAccessToken(token)).toMatchObject({ sub: 7, roles: [Role.DOCTOR] });
  });

  it('define prazo de expiracao no token', () => {
    const decoded = jwt.decode(signAccessToken({ sub: 7, roles: [Role.ADMIN] }));

    expect(decoded).toHaveProperty('exp');
  });

  it.each([
    ['assinado com outro segredo', jwt.sign({ sub: 7, roles: ['admin'] }, 'outro')],
    ['expirado', jwt.sign({ sub: 7, roles: ['admin'] }, 'segredo-de-teste', { expiresIn: -1 })],
    ['no formato antigo', jwt.sign({ sub: '7', role: 'ADMIN' }, 'segredo-de-teste')],
    ['com perfil inexistente', jwt.sign({ sub: 7, roles: ['root'] }, 'segredo-de-teste')],
    ['malformado', 'nao-e-um-token'],
  ])('recusa token %s com NAO_AUTENTICADO', (_caso, token) => {
    expect(() => verifyAccessToken(token)).toThrow(
      expect.objectContaining({ code: 'NAO_AUTENTICADO' }),
    );
  });
});
