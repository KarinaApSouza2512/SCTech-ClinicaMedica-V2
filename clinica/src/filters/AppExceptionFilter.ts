import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorCode } from '../errors/ErrorCode';
import { AppError } from '../utils/AppError';

type ErrorName = ErrorCode | 'ERRO_INTERNO';

interface ErrorResponseBody {
  statusCode: number;
  error: ErrorName;
  message: string;
}

interface ErrorInfo {
  statusCode: number;
  error: ErrorName;
  message: string;
}

const PG_UNIQUE_VIOLATION = '23505';

// Nome da constraint unique no banco -> codigo do catalogo
const UNIQUE_CONSTRAINT_CODES: Record<string, ErrorCode> = {
  UQ_users_email: 'EMAIL_JA_CADASTRADO',
  UQ_patients_cpf: 'CPF_JA_CADASTRADO',
  UQ_doctors_crm: 'CRM_JA_CADASTRADO',
};

const INTERNAL_ERROR: ErrorInfo = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  error: 'ERRO_INTERNO',
  message: 'Erro interno do servidor',
};

// Erros lancados pelo proprio Nest (rota inexistente, JSON malformado etc.)
function fromHttpException(exception: HttpException): ErrorInfo {
  const statusCode = exception.getStatus();

  switch (statusCode) {
    case HttpStatus.UNAUTHORIZED:
      return { statusCode, error: 'NAO_AUTENTICADO', message: 'Nao autenticado' };
    case HttpStatus.FORBIDDEN:
      return { statusCode, error: 'ACESSO_NEGADO', message: 'Acesso negado' };
    case HttpStatus.NOT_FOUND:
      return { statusCode, error: 'RECURSO_NAO_ENCONTRADO', message: 'Recurso nao encontrado' };
  }

  if (statusCode < HttpStatus.INTERNAL_SERVER_ERROR) {
    return { statusCode, error: 'DADOS_INVALIDOS', message: 'Requisicao malformada' };
  }

  return INTERNAL_ERROR;
}

function uniqueViolationCode(error: QueryFailedError): ErrorCode | undefined {
  const driverError = error.driverError as { code?: string; constraint?: string } | undefined;

  if (driverError?.code !== PG_UNIQUE_VIOLATION || !driverError.constraint) {
    return undefined;
  }

  return UNIQUE_CONSTRAINT_CODES[driverError.constraint];
}

// Ponto unico de tratamento de erro da aplicacao
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const info = this.toErrorInfo(exception);

    if (info.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(exception);
    }

    const body: ErrorResponseBody = {
      statusCode: info.statusCode,
      error: info.error,
      message: info.message,
    };
    response.status(info.statusCode).json(body);
  }

  private toErrorInfo(exception: unknown): ErrorInfo {
    if (exception instanceof AppError) {
      return { statusCode: exception.statusCode, error: exception.code, message: exception.message };
    }

    if (exception instanceof HttpException) {
      return fromHttpException(exception);
    }

    if (exception instanceof QueryFailedError) {
      const code = uniqueViolationCode(exception);
      if (code) {
        return { statusCode: HttpStatus.CONFLICT, error: code, message: 'Registro ja existente' };
      }
    }

    return INTERNAL_ERROR;
  }
}
