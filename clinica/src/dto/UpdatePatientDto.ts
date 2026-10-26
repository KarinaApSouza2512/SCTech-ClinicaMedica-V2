import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TrimString } from './TrimString';

// CPF nao e alteravel; se vier no corpo, o whitelist descarta
export class UpdatePatientDto {
  @ApiProperty({ example: 'Marcos Marcolino' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
