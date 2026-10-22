import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
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

function pgErrorCode(error: QueryFailedError): string | undefined {
  const driverError = error.driverError as { code?: string } | undefined;
  return driverError?.code;
}

// Erros lancados pelo proprio Nest (rota inexistente, JSON malformado etc.)
function httpExceptionMessage(exception: HttpException, request: Request): string {
  const status = exception.getStatus();

  if (status === HttpStatus.NOT_FOUND) {
    return `Rota nao encontrada: ${request.method} ${request.originalUrl}`;
  }

  if (status === HttpStatus.BAD_REQUEST) {
    return 'JSON malformado no corpo da requisicao';
  }

  return exception.message;
}

// Ponto unico de tratamento de erro da aplicacao
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof AppError) {
      this.send(response, exception.statusCode, exception.message, exception.details);
      return;
    }

    if (exception instanceof HttpException) {
      this.send(response, exception.getStatus(), httpExceptionMessage(exception, request));
      return;
    }

    if (exception instanceof QueryFailedError && pgErrorCode(exception) === PG_UNIQUE_VIOLATION) {
      this.send(response, HttpStatus.CONFLICT, 'Registro ja existente');
      return;
    }

    if (env.nodeEnv === 'development') {
      console.error(exception);
    }

    this.send(response, HttpStatus.INTERNAL_SERVER_ERROR, 'Erro interno do servidor');
  }

  private send(response: Response, statusCode: number, message: string, details?: unknown): void {
    const body: ErrorResponseBody = { status: 'error', statusCode, message };

    if (details !== undefined) {
      body.details = details;
    }

    response.status(statusCode).json(body);
  }
}
