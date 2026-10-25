import { Module } from '@nestjs/common';
import { MedicalRecordController } from '../controllers/MedicalRecordController';
import { MEDICAL_RECORD_REPOSITORY } from '../repositories/ports/IMedicalRecordRepository';
import { TypeOrmMedicalRecordRepository } from '../repositories/typeorm/TypeOrmMedicalRecordRepository';
import { MedicalRecordService } from '../services/MedicalRecordService';
import { AppointmentModule } from './AppointmentModule';
import { DoctorModule } from './DoctorModule';
import { PatientModule } from './PatientModule';

@Module({
  imports: [AppointmentModule, PatientModule, DoctorModule],
  controllers: [MedicalRecordController],
  providers: [
    { provide: MEDICAL_RECORD_REPOSITORY, useClass: TypeOrmMedicalRecordRepository },
    MedicalRecordService,
  ],
})
export class MedicalRecordModule {}
