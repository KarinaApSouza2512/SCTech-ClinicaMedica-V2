import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { DomainError } from '../errors/DomainError';
import { ErrorCode } from '../errors/ErrorCode';

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

// Unico lugar que conhece o status HTTP de cada codigo do catalogo
const STATUS_BY_CODE: Record<ErrorCode, number> = {
  DADOS_INVALIDOS: HttpStatus.BAD_REQUEST,
  NAO_AUTENTICADO: HttpStatus.UNAUTHORIZED,
  CREDENCIAIS_INVALIDAS: HttpStatus.UNAUTHORIZED,
  ACESSO_NEGADO: HttpStatus.FORBIDDEN,
  RECURSO_NAO_ENCONTRADO: HttpStatus.NOT_FOUND,
  EMAIL_JA_CADASTRADO: HttpStatus.CONFLICT,
  CPF_JA_CADASTRADO: HttpStatus.CONFLICT,
  CRM_JA_CADASTRADO: HttpStatus.CONFLICT,
  HORARIO_INDISPONIVEL: HttpStatus.CONFLICT,
  PACIENTE_INDISPONIVEL: HttpStatus.CONFLICT,
  HORARIO_FORA_DA_ESCALA: HttpStatus.UNPROCESSABLE_ENTITY,
  TRANSICAO_INVALIDA: HttpStatus.UNPROCESSABLE_ENTITY,
};

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
    if (exception instanceof DomainError) {
      return {
        statusCode: STATUS_BY_CODE[exception.code],
        error: exception.code,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      return fromHttpException(exception);
    }

    if (exception instanceof QueryFailedError) {
      const code = uniqueViolationCode(exception);
      if (code) {
        return { statusCode: STATUS_BY_CODE[code], error: code, message: 'Registro ja existente' };
      }
    }

    return INTERNAL_ERROR;
  }
}
