import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from '../controllers/HealthController';
import { dataSourceOptions } from '../database/data-source';
import { AuthModule } from './AuthModule';
import { UserModule } from './UserModule';

@Module({
  imports: [
    // Aplica as migrations pendentes ao conectar, antes de a API aceitar requisicoes
    TypeOrmModule.forRoot({ ...dataSourceOptions, migrationsRun: true }),
    UserModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
