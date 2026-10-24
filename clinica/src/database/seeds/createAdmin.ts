import { DataSource } from 'typeorm';
import { User } from '../../entities/User';
import { Role } from '../../enums/Role';
import { normalizeEmail } from '../../utils/email';
import { hashPassword } from '../../utils/hash';

export interface AdminSeedConfig {
  name: string;
  email: string;
  password: string;
}

export function isAdminConfigured(config: AdminSeedConfig): boolean {
  return config.email.trim() !== '' && config.password !== '';
}

// Cria o primeiro admin; se o e-mail ja existir, nao faz nada (pode rodar varias vezes)
export async function createAdmin(
  dataSource: DataSource,
  config: AdminSeedConfig,
): Promise<boolean> {
  const email = normalizeEmail(config.email);

  if (!isAdminConfigured(config)) {
    throw new Error('ADMIN_EMAIL e ADMIN_PASSWORD precisam estar definidos para criar o admin');
  }

  const repository = dataSource.getRepository(User);

  if (await repository.exists({ where: { email } })) {
    return false;
  }

  // ON CONFLICT DO NOTHING cobre duas instancias rodando a seed ao mesmo tempo
  const result = await repository
    .createQueryBuilder()
    .insert()
    .values({
      name: config.name.trim(),
      email,
      password: await hashPassword(config.password),
      roles: [Role.ADMIN],
    })
    .orIgnore()
    .execute();

  return result.identifiers.length > 0;
}
