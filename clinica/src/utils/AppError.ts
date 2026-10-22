export type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 500;

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly details?: unknown;

  constructor(message: string, statusCode: HttpStatusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'Nao autorizado'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Acesso negado'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = 'Recurso nao encontrado'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }
}
