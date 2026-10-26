import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// Sem IsEmail: e-mail em formato estranho cai em 401 CREDENCIAIS_INVALIDAS, nao em 400
export class LoginDto {
  @ApiProperty({ example: 'admin@medclinic.com' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SenhaForte@123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
