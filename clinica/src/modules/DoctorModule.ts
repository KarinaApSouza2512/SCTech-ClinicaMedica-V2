import { Module } from '@nestjs/common';
import { DoctorController } from '../controllers/DoctorController';
import { DOCTOR_REPOSITORY } from '../repositories/ports/IDoctorRepository';
import { TypeOrmDoctorRepository } from '../repositories/typeorm/TypeOrmDoctorRepository';
import { DoctorService } from '../services/DoctorService';
import { UserModule } from './UserModule';

@Module({
  imports: [UserModule],
  controllers: [DoctorController],
  providers: [{ provide: DOCTOR_REPOSITORY, useClass: TypeOrmDoctorRepository }, DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
