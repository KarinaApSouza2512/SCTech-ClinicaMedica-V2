import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

// Parametro :doctorId das rotas aninhadas em /doctors
export class DoctorIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctorId!: number;
}
