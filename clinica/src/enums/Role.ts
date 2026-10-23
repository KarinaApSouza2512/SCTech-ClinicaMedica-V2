// Perfis da etapa 2, com os nomes exatos do contrato
export enum Role {
  ADMIN = 'admin',
  SECRETARY = 'secretary',
  DOCTOR = 'doctor',
}

export const ROLE_VALUES: readonly Role[] = Object.values(Role);

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLE_VALUES as readonly string[]).includes(value);
}

export function isRoleList(value: unknown): value is Role[] {
  return Array.isArray(value) && value.length > 0 && value.every(isRole);
}
