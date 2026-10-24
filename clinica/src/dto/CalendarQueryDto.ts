import { IsLocalDate } from './IsLocalDate';

// Dias locais da clinica, inclusivos; limite de 31 dias validado no service
export class CalendarQueryDto {
  @IsLocalDate()
  from!: string;

  @IsLocalDate()
  to!: string;
}
