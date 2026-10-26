import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../enums/AppointmentStatus';

export class UpdateAppointmentStatusDto {
  // Valor fora do enum gera 400; transicao nao permitida e decidida no service (422)
  @ApiProperty({ enum: AppointmentStatus, example: AppointmentStatus.IN_PROGRESS })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}
