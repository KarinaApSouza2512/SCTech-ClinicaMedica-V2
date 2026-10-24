import 'reflect-metadata';
import path from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from '../config/env';
import { User } from '../entities/User';

const { database } = env;

// Banco gerenciado exige SSL; o certificado do provedor nao e validado contra uma CA local
const connection =
  'url' in database
    ? { url: database.url }
    : {
        host: database.host,
        port: database.port,
        username: database.user,
        password: database.password,
        database: database.name,
      };

// Mesmas opcoes para o Nest (TypeOrmModule) e para a CLI de migrations
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...connection,
  ssl: database.ssl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: env.nodeEnv === 'development',
  entities: [User],
  // Rodando do dist so existem .js; com ts-node, so .ts
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
};

export const AppDataSource = new DataSource(dataSourceOptions);
