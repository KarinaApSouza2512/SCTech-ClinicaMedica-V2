import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../enums/AppointmentStatus';

export class UpdateAppointmentStatusDto {
  // Valor fora do enum gera 400; transicao nao permitida e decidida no service (422)
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}
