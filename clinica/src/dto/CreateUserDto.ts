import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../enums/Role';
import { TrimString } from './TrimString';

export class CreateUserDto {
  // O contrato so exige nome presente; espacos nas pontas nao contam
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  // Perfil fora da lista gera 400 DADOS_INVALIDOS
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
