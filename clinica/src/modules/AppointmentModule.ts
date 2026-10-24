import { Module } from '@nestjs/common';
import { AppointmentController } from '../controllers/AppointmentController';
import { CalendarController } from '../controllers/CalendarController';
import { APPOINTMENT_REPOSITORY } from '../repositories/ports/IAppointmentRepository';
import { TypeOrmAppointmentRepository } from '../repositories/typeorm/TypeOrmAppointmentRepository';
import { AppointmentService } from '../services/AppointmentService';
import { DoctorModule } from './DoctorModule';
import { PatientModule } from './PatientModule';
import { WorkScheduleModule } from './WorkScheduleModule';

@Module({
  imports: [DoctorModule, PatientModule, WorkScheduleModule],
  controllers: [AppointmentController, CalendarController],
  providers: [
    { provide: APPOINTMENT_REPOSITORY, useClass: TypeOrmAppointmentRepository },
    AppointmentService,
  ],
  exports: [AppointmentService],
})
export class AppointmentModule {}
