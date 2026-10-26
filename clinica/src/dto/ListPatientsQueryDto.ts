import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from './PaginationQueryDto';
import { TrimString } from './TrimString';

export class ListPatientsQueryDto extends PaginationQueryDto {
  // Busca parcial, sem diferenciar maiusculas
  @ApiPropertyOptional({ description: 'Trecho do nome, sem diferenciar maiusculas' })
  @IsOptional()
  @TrimString()
  @IsString()
  @MaxLength(120)
  name?: string;
}
