import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import { env } from './config/env';
import { AppDataSource } from './database/data-source';
import { errorMiddleware, notFoundMiddleware } from './middlewares/errorMiddleware';
import { router } from './routes';

export function createApp(): Application {
  const app = express();

  app.use(express.json());

  app.get('/', (_request: Request, response: Response) => {
    response.json({ name: 'MedClinic API', stage: 'Autenticacao e Autorizacao' });
  });

  app.use(router);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`MedClinic API ouvindo na porta ${env.port}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error('Falha ao iniciar a aplicacao:', error);
  process.exit(1);
});
