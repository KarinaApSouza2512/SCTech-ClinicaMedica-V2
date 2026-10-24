import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TrimString } from './TrimString';

// So o texto: doctorId ou patientId no corpo sao descartados pelo whitelist
export class CreateMedicalRecordDto {
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  text!: string;
}
