import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { env } from './config/env';
import { createAdmin, isAdminConfigured } from './database/seeds/createAdmin';
import { AppExceptionFilter } from './filters/AppExceptionFilter';
import { AppModule } from './modules/AppModule';
import { DtoValidationPipe } from './pipes/DtoValidationPipe';

// Roda depois das migrations (feitas pelo TypeOrmModule ao conectar)
async function seedAdmin(dataSource: DataSource): Promise<void> {
  if (!isAdminConfigured(env.admin)) {
    console.warn('ADMIN_EMAIL ou ADMIN_PASSWORD nao definidos: administrador inicial nao criado');
    return;
  }

  const created = await createAdmin(dataSource, env.admin);
  console.log(created ? 'Administrador inicial criado' : 'Administrador inicial ja existia');
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await seedAdmin(app.get(DataSource));

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new DtoValidationPipe());
  app.useGlobalFilters(new AppExceptionFilter());

  // 0.0.0.0 para receber trafego de fora do container na nuvem
  await app.listen(env.port, '0.0.0.0');
  console.log(`MedClinic API ouvindo na porta ${env.port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('Falha ao iniciar a aplicacao:', error);
  process.exit(1);
});
