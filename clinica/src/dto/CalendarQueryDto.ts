import { ApiProperty } from '@nestjs/swagger';
import { IsLocalDate } from './IsLocalDate';

// Dias locais da clinica, inclusivos; limite de 31 dias validado no service
export class CalendarQueryDto {
  @ApiProperty({ example: '2026-10-12', description: 'Dia local, inclusivo' })
  @IsLocalDate()
  from!: string;

  @ApiProperty({ example: '2026-10-16', description: 'Dia local, inclusivo; ate 31 dias' })
  @IsLocalDate()
  to!: string;
}
