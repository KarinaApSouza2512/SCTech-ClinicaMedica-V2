import { ValidationError, ValidationPipe } from '@nestjs/common';
import { DomainError } from '../errors/DomainError';

// Junta as mensagens de todos os campos, inclusive de objetos aninhados
function collectMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collectMessages(error.children ?? []),
  ]);
}

// Valida @Body(), @Param() e @Query() pelo DTO tipado no parametro do controller.
// O valor validado chega como argumento do metodo, entao request.query (somente
// leitura no Express 5) nunca e reescrito.
export class DtoValidationPipe extends ValidationPipe {
  constructor() {
    super({
      // Remove campos que nao estao no DTO; o contrato manda ignorar extras
      whitelist: true,
      // Converte para a classe do DTO, aplicando @Type e valores padrao
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new DomainError(
          'DADOS_INVALIDOS',
          `Dados de entrada invalidos: ${collectMessages(errors).join('; ')}`,
        ),
    });
  }
}
