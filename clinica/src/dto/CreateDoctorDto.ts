import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimString } from './TrimString';

// Mesmas regras de nome, e-mail e senha do CreateUserDto
export class CreateDoctorDto {
  @ApiProperty({ example: 'Dra. Helena Souza' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'helena@medclinic.com' })
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  // Formato livre, como "CRM-SC-54321"
  @ApiProperty({ example: 'CRM-SC-54321' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  crm!: string;
}
