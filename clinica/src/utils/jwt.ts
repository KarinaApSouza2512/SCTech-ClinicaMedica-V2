import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { isRole, Role } from '../enums/Role';
import { AppError } from './AppError';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

function isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.email === 'string' &&
    isRole(candidate.role)
  );
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
    throw AppError.unauthorized('Token invalido ou expirado');
  }

  if (!isAccessTokenPayload(decoded)) {
    throw AppError.unauthorized('Token invalido ou expirado');
  }

  return decoded;
}
