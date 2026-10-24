import { QueryFailedError } from 'typeorm';
import { DomainError } from './DomainError';
import { ErrorCode } from './ErrorCode';

const PG_UNIQUE_VIOLATION = '23505';

interface UniqueConstraintError {
  code: ErrorCode;
  message: string;
}

// Nome da constraint unique no banco -> erro do catalogo
const UNIQUE_CONSTRAINT_ERRORS: Record<string, UniqueConstraintError> = {
  UQ_users_email: { code: 'EMAIL_JA_CADASTRADO', message: 'E-mail ja cadastrado' },
  UQ_patients_cpf: { code: 'CPF_JA_CADASTRADO', message: 'CPF ja cadastrado' },
  UQ_doctors_crm: { code: 'CRM_JA_CADASTRADO', message: 'CRM ja cadastrado' },
};

// Converte a violacao de unique do Postgres no DomainError equivalente
export function uniqueViolationError(error: unknown): DomainError | undefined {
  if (!(error instanceof QueryFailedError)) {
    return undefined;
  }

  const driverError = error.driverError as { code?: string; constraint?: string } | undefined;

  if (driverError?.code !== PG_UNIQUE_VIOLATION || !driverError.constraint) {
    return undefined;
  }

  const known = UNIQUE_CONSTRAINT_ERRORS[driverError.constraint];
  return known ? new DomainError(known.code, known.message) : undefined;
}
