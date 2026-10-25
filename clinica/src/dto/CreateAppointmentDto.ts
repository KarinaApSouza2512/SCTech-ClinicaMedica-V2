import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsISO8601, Matches, Min } from 'class-validator';

// Data e hora com fuso explicito (Z ou +-HH:MM); sem fuso o instante seria ambiguo
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export class CreateAppointmentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  doctorId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  patientId!: number;

  // IsISO8601 strict recusa datas inexistentes, como 2026-02-30
  @ApiProperty({ example: '2026-10-13T08:00:00-03:00', description: 'ISO 8601 com fuso' })
  @IsISO8601({ strict: true })
  @Matches(ISO_WITH_OFFSET, { message: 'startsAt deve ser ISO 8601 com fuso explicito' })
  startsAt!: string;
}
