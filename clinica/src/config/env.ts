import 'dotenv/config';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface Env {
  nodeEnv: string;
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  bcryptSaltRounds: number;
}

function readString(key: string, fallback: string): string {
  const value = process.env[key];
  return value !== undefined && value.trim() !== '' ? value : fallback;
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

export const env: Env = {
  nodeEnv: readString('NODE_ENV', 'development'),
  port: readNumber('PORT', 3000),
  database: {
    host: readString('DB_HOST', 'localhost'),
    port: readNumber('DB_PORT', 5434),
    user: readString('DB_USER', 'admin'),
    password: readString('DB_PASSWORD', 'password123'),
    name: readString('DB_NAME', 'sctec'),
  },
  jwt: {
    secret: readString('JWT_SECRET', 'troque-este-valor-em-producao'),
    expiresIn: readString('JWT_EXPIRES_IN', '1d'),
  },
  bcryptSaltRounds: readNumber('BCRYPT_SALT_ROUNDS', 10),
};
