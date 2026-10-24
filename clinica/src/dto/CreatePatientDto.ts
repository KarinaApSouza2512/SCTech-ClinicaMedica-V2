import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { TrimString } from './TrimString';

export class CreatePatientDto {
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  // Somente digitos: com pontuacao ou tamanho diferente de 11 gera 400
  @IsString()
  @Matches(/^\d{11}$/, { message: 'cpf deve ter exatamente 11 digitos numericos' })
  cpf!: string;
}
