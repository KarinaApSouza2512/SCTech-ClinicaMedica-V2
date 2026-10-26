import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TrimString } from './TrimString';

// So o texto: doctorId ou patientId no corpo sao descartados pelo whitelist
export class CreateMedicalRecordDto {
  @ApiProperty({ example: 'Paciente relata dor lombar ha duas semanas.' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  text!: string;
}
