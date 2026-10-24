import { Module } from '@nestjs/common';
import { PatientController } from '../controllers/PatientController';
import { PATIENT_REPOSITORY } from '../repositories/ports/IPatientRepository';
import { TypeOrmPatientRepository } from '../repositories/typeorm/TypeOrmPatientRepository';
import { PatientService } from '../services/PatientService';

@Module({
  controllers: [PatientController],
  providers: [{ provide: PATIENT_REPOSITORY, useClass: TypeOrmPatientRepository }, PatientService],
})
export class PatientModule {}
