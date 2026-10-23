import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

// Parametro :id das rotas, recebido como texto na URL
export class IdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
