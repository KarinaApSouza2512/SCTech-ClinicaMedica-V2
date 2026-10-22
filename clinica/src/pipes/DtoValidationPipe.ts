import { ValidationError, ValidationPipe } from '@nestjs/common';
import { AppError } from '../utils/AppError';

interface FieldError {
  field: string;
  messages: string[];
}

function toFieldErrors(errors: ValidationError[]): FieldError[] {
  return errors.map((error) => ({
    field: error.property,
    messages: Object.values(error.constraints ?? {}),
  }));
}

export class DtoValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        AppError.badRequest('Dados de entrada invalidos', toFieldErrors(errors)),
    });
  }
}
