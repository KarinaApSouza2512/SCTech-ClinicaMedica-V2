import { Module } from '@nestjs/common';
import { WorkScheduleController } from '../controllers/WorkScheduleController';
import { WORK_SCHEDULE_REPOSITORY } from '../repositories/ports/IWorkScheduleRepository';
import { TypeOrmWorkScheduleRepository } from '../repositories/typeorm/TypeOrmWorkScheduleRepository';
import { WorkScheduleService } from '../services/WorkScheduleService';
import { DoctorModule } from './DoctorModule';

@Module({
  imports: [DoctorModule],
  controllers: [WorkScheduleController],
  providers: [
    { provide: WORK_SCHEDULE_REPOSITORY, useClass: TypeOrmWorkScheduleRepository },
    WorkScheduleService,
  ],
  exports: [WorkScheduleService],
})
export class WorkScheduleModule {}
