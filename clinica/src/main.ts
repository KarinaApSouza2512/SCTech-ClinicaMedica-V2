import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { env } from './config/env';
import { AppExceptionFilter } from './filters/AppExceptionFilter';
import { AppModule } from './modules/AppModule';
import { DtoValidationPipe } from './pipes/DtoValidationPipe';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new DtoValidationPipe());
  app.useGlobalFilters(new AppExceptionFilter());

  await app.listen(env.port);
  console.log(`MedClinic API ouvindo na porta ${env.port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('Falha ao iniciar a aplicacao:', error);
  process.exit(1);
});
