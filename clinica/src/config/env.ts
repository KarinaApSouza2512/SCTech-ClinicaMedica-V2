import 'dotenv/config';

// Conexao por URL unica (Neon, Render) ou por campos separados (Docker local)
type DatabaseConnection =
  { url: string } | { host: string; port: number; user: string; password: string; name: string };

type DatabaseConfig = DatabaseConnection & { ssl: boolean };

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface AdminConfig {
  name: string;
  email: string;
  password: string;
}

interface Env {
  nodeEnv: string;
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  bcryptSaltRounds: number;
  admin: AdminConfig;
}

function readString(key: string, fallback: string): string {
  const value = process.env[key];
  return value !== undefined && value.trim() !== '' ? value : fallback;
}

// Segredos nao tem valor padrao: sem a variavel, a aplicacao nao sobe
function readRequired(key: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Environment variable ${key} is required`);
  }

  return value;
}

function readBoolean(key: string, fallback: boolean): boolean {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return value.trim().toLowerCase() === 'true';
}

function readNumber(key: string, fallback: number): number {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsed;
}

// DATABASE_URL tem prioridade; sem ela, usuario e senha passam a ser obrigatorios
function readDatabase(): DatabaseConfig {
  const ssl = readBoolean('DB_SSL', false);
  const url = readString('DATABASE_URL', '');

  if (url !== '') {
    return { url, ssl };
  }

  return {
    host: readString('DB_HOST', 'localhost'),
    port: readNumber('DB_PORT', 5432),
    user: readRequired('DB_USER'),
    password: readRequired('DB_PASSWORD'),
    name: readString('DB_NAME', 'sctec'),
    ssl,
  };
}

export const env: Env = {
  nodeEnv: readString('NODE_ENV', 'development'),
  port: readNumber('PORT', 3000),
  database: readDatabase(),
  jwt: {
    secret: readRequired('JWT_SECRET'),
    expiresIn: readString('JWT_EXPIRES_IN', '1d'),
  },
  bcryptSaltRounds: readNumber('BCRYPT_SALT_ROUNDS', 10),
  // Sem valor padrao para e-mail e senha: a seed recusa rodar sem eles
  admin: {
    name: readString('ADMIN_NAME', 'Administrador'),
    email: readString('ADMIN_EMAIL', ''),
    password: readString('ADMIN_PASSWORD', ''),
  },
};
