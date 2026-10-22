export enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  ATTENDANT = 'ATTENDANT',
  PATIENT = 'PATIENT',
}

export const ROLE_VALUES: readonly Role[] = Object.values(Role);

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLE_VALUES as readonly string[]).includes(value);
}
