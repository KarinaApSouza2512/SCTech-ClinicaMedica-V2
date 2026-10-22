import 'reflect-metadata';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { env } from '../config/env';

const rootDir = path.resolve(__dirname, '..');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.database.host,
  port: env.database.port,
  username: env.database.user,
  password: env.database.password,
  database: env.database.name,
  synchronize: false,
  logging: env.nodeEnv === 'development',
  entities: [path.join(rootDir, 'entities', '*.{ts,js}')],
  migrations: [path.join(rootDir, 'database', 'migrations', '*.{ts,js}')],
});
