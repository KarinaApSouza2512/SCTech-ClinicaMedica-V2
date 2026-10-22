import 'reflect-metadata';
import path from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from '../config/env';
import { User } from '../entities/User';

// Mesmas opcoes para o Nest (TypeOrmModule) e para a CLI de migrations
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: env.database.host,
  port: env.database.port,
  username: env.database.user,
  password: env.database.password,
  database: env.database.name,
  synchronize: false,
  logging: env.nodeEnv === 'development',
  entities: [User],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
};

export const AppDataSource = new DataSource(dataSourceOptions);
