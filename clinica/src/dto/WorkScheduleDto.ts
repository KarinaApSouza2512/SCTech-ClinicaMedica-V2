import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

// 00:00 a 23:59, sempre com dois digitos
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_MESSAGE = '$property deve estar no formato HH:MM';

export class WorkShiftDto {
  // 0 = domingo ... 6 = sabado
  @ApiProperty({ example: 2, minimum: 0, maximum: 6, description: '0 = domingo' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekDay!: number;

  @ApiProperty({ example: '08:00', description: 'HH:MM, hora local da clinica' })
  @IsString()
  @Matches(TIME_PATTERN, { message: TIME_MESSAGE })
  startTime!: string;

  @ApiProperty({ example: '12:00', description: 'HH:MM, hora local da clinica' })
  @IsString()
  @Matches(TIME_PATTERN, { message: TIME_MESSAGE })
  endTime!: string;

  @ApiProperty({ example: 30, minimum: 1 })
  @IsInt()
  @Min(1)
  slotDurationMinutes!: number;
}

// Escala completa; lista vazia apaga a escala do medico
export class WorkScheduleDto {
  @ApiProperty({ type: () => [WorkShiftDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkShiftDto)
  shifts!: WorkShiftDto[];
}
