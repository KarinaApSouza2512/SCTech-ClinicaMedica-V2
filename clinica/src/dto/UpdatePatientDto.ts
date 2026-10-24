import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TrimString } from './TrimString';

// CPF nao e alteravel; se vier no corpo, o whitelist descarta
export class UpdatePatientDto {
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
