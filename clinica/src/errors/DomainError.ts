import { ErrorCode } from './ErrorCode';

// Erro de regra de negocio: so tem o codigo do catalogo, sem status HTTP.
// A traducao para status fica no AppExceptionFilter.
export class DomainError extends Error {
  public readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
