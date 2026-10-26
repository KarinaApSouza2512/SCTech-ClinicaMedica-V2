import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

// Documentacao interativa em /api/docs; o botao Authorize recebe o accessToken do login
function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('MedClinic API')
    .setDescription(
      'API da clinica medica. Trabalho de conclusão de curso SCTech - Karina Ap. de Souza. ' +
        'Faca o login em POST /api/v1/auth/login e cole o accessToken em Authorize.',
    )
    .setVersion('2.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), {
    // Mantem o token ao recarregar a pagina
    swaggerOptions: { persistAuthorization: true },
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await seedAdmin(app.get(DataSource));

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new DtoValidationPipe());
  app.useGlobalFilters(new AppExceptionFilter());
  // Depois do prefixo global, para as rotas aparecerem com /api/v1
  setupSwagger(app);

  // 0.0.0.0 para receber trafego de fora do container na nuvem
  await app.listen(env.port, '0.0.0.0');
  console.log(`MedClinic API ouvindo na porta ${env.port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('Falha ao iniciar a aplicacao:', error);
  process.exit(1);
});
