import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

// 00:00 a 23:59, sempre com dois digitos
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_MESSAGE = '$property deve estar no formato HH:MM';

export class WorkShiftDto {
  // 0 = domingo ... 6 = sabado
  @IsInt()
  @Min(0)
  @Max(6)
  weekDay!: number;

  @IsString()
  @Matches(TIME_PATTERN, { message: TIME_MESSAGE })
  startTime!: string;

  @IsString()
  @Matches(TIME_PATTERN, { message: TIME_MESSAGE })
  endTime!: string;

  @IsInt()
  @Min(1)
  slotDurationMinutes!: number;
}

// Escala completa; lista vazia apaga a escala do medico
export class WorkScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkShiftDto)
  shifts!: WorkShiftDto[];
}
