import { ErrorCode } from '../errors/ErrorCode';

export type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 422;

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatusCode;

  constructor(code: ErrorCode, message: string, statusCode: HttpStatusCode) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }

  static badRequest(message: string): AppError {
    return new AppError('DADOS_INVALIDOS', message, 400);
  }

  static unauthorized(
    message = 'Nao autenticado',
    code: 'NAO_AUTENTICADO' | 'CREDENCIAIS_INVALIDAS' = 'NAO_AUTENTICADO',
  ): AppError {
    return new AppError(code, message, 401);
  }

  static forbidden(message = 'Acesso negado'): AppError {
    return new AppError('ACESSO_NEGADO', message, 403);
  }

  static notFound(message = 'Recurso nao encontrado'): AppError {
    return new AppError('RECURSO_NAO_ENCONTRADO', message, 404);
  }

  static conflict(code: ErrorCode, message: string): AppError {
    return new AppError(code, message, 409);
  }
}
