import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from './PaginationQueryDto';
import { TrimString } from './TrimString';

export class ListDoctorsQueryDto extends PaginationQueryDto {
  // Busca parcial no nome do usuario, sem diferenciar maiusculas
  @IsOptional()
  @TrimString()
  @IsString()
  @MaxLength(120)
  name?: string;
}
