import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from '../controllers/HealthController';
import { dataSourceOptions } from '../database/data-source';
import { AuthModule } from './AuthModule';
import { DoctorModule } from './DoctorModule';
import { PatientModule } from './PatientModule';
import { UserModule } from './UserModule';
import { WorkScheduleModule } from './WorkScheduleModule';

@Module({
  imports: [
    // Aplica as migrations pendentes ao conectar, antes de a API aceitar requisicoes
    TypeOrmModule.forRoot({ ...dataSourceOptions, migrationsRun: true }),
    UserModule,
    AuthModule,
    PatientModule,
    DoctorModule,
    WorkScheduleModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
