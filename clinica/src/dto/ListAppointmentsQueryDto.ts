import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AppointmentStatus } from '../enums/AppointmentStatus';
import { IsLocalDate } from './IsLocalDate';
import { PaginationQueryDto } from './PaginationQueryDto';

export class ListAppointmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  patientId?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  // Dias locais da clinica, inteiros e inclusivos
  @IsOptional()
  @IsLocalDate()
  from?: string;

  @IsOptional()
  @IsLocalDate()
  to?: string;
}
