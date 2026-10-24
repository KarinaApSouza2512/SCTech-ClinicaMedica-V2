import 'reflect-metadata';
import { env } from '../../config/env';
import { AppDataSource } from '../data-source';
import { createAdmin } from './createAdmin';

async function runSeed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const created = await createAdmin(AppDataSource, env.admin);
    console.log(created ? 'Administrador criado' : 'Administrador ja existia');
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed().catch((error: unknown) => {
  console.error('Falha ao rodar a seed:', error);
  process.exit(1);
});
