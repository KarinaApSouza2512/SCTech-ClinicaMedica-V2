import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Karina Aparecida' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'karina@medclinic.com' })
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  // Perfil fora da lista gera 400 DADOS_INVALIDOS
  @ApiProperty({ enum: Role, isArray: true, example: [Role.SECRETARY] })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
