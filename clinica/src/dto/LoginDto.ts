import { IsNotEmpty, IsString } from 'class-validator';

// Sem IsEmail: e-mail em formato estranho cai em 401 CREDENCIAIS_INVALIDAS, nao em 400
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
