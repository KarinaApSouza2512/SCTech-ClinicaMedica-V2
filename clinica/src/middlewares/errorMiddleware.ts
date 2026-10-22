import { NextFunction, Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

interface ErrorResponseBody {
  status: 'error';
  statusCode: number;
  message: string;
  details?: unknown;
}

const PG_UNIQUE_VIOLATION = '23505';

function sendError(response: Response, statusCode: number, message: string, details?: unknown): void {
  const body: ErrorResponseBody = { status: 'error', statusCode, message };

  if (details !== undefined) {
    body.details = details;
  }

  response.status(statusCode).json(body);
}

function isBodyParserError(error: unknown): error is SyntaxError {
  return error instanceof SyntaxError && 'body' in error;
}

function pgErrorCode(error: QueryFailedError): string | undefined {
  const driverError = error.driverError as { code?: string } | undefined;
  return driverError?.code;
}

export function notFoundMiddleware(request: Request, _response: Response, next: NextFunction): void {
  next(AppError.notFound(`Rota nao encontrada: ${request.method} ${request.originalUrl}`));
}

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    sendError(response, error.statusCode, error.message, error.details);
    return;
  }

  if (isBodyParserError(error)) {
    sendError(response, 400, 'JSON malformado no corpo da requisicao');
    return;
  }

  if (error instanceof QueryFailedError) {
    if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
      sendError(response, 409, 'Registro ja existente');
      return;
    }
  }

  if (env.nodeEnv === 'development') {
    console.error(error);
  }

  sendError(response, 500, 'Erro interno do servidor');
}
