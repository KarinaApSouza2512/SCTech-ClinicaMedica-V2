import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { isRoleList, Role } from '../enums/Role';
import { DomainError } from '../errors/DomainError';

// O token carrega so o id do usuario e os perfis
export interface AccessTokenPayload {
  sub: number;
  roles: Role[];
}

function isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Number.isInteger(candidate.sub) && isRoleList(candidate.roles);
}

export function signAccessToken(payload: AccessTokenPayload): string {
  // A biblioteca tipa expiresIn como um literal de tempo; o valor vem do .env como string livre.
  const options: SignOptions = { expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwt.secret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  let decoded: unknown;

  try {
    decoded = jwt.verify(token, env.jwt.secret);
  } catch {
    throw new DomainError('NAO_AUTENTICADO', 'Token invalido ou expirado');
  }

  if (!isAccessTokenPayload(decoded)) {
    throw new DomainError('NAO_AUTENTICADO', 'Token invalido ou expirado');
  }

  return decoded;
}
