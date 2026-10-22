import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from '../controllers/AdminController';
import { HealthController } from '../controllers/HealthController';
import { dataSourceOptions } from '../database/data-source';
import { AuthModule } from './AuthModule';
import { UserModule } from './UserModule';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), UserModule, AuthModule],
  controllers: [HealthController, AdminController],
})
export class AppModule {}
