import { ValidationError, ValidationPipe } from '@nestjs/common';
import { AppError } from '../utils/AppError';

// Junta as mensagens de todos os campos, inclusive de objetos aninhados
function collectMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collectMessages(error.children ?? []),
  ]);
}

export class DtoValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        AppError.badRequest(`Dados de entrada invalidos: ${collectMessages(errors).join('; ')}`),
    });
  }
}
