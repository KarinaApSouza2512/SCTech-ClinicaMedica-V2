import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AppointmentStatus } from '../enums/AppointmentStatus';
import { IsLocalDate } from './IsLocalDate';
import { PaginationQueryDto } from './PaginationQueryDto';

export class ListAppointmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  patientId?: number;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  // Dias locais da clinica, inteiros e inclusivos
  @ApiPropertyOptional({ example: '2026-10-12', description: 'Dia local, inclusivo' })
  @IsOptional()
  @IsLocalDate()
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-16', description: 'Dia local, inclusivo' })
  @IsOptional()
  @IsLocalDate()
  to?: string;
}
