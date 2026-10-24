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
  // O repositorio sai do modulo para o agendamento ler a escala sem buscar o medico de novo
  exports: [WorkScheduleService, WORK_SCHEDULE_REPOSITORY],
})
export class WorkScheduleModule {}
