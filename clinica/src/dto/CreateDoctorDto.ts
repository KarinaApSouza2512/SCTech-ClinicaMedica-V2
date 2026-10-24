import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimString } from './TrimString';

// Mesmas regras de nome, e-mail e senha do CreateUserDto
export class CreateDoctorDto {
  @TrimString()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  // Formato livre, como "CRM-SC-54321"
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  crm!: string;
}
