// E-mail e comparado sem diferenciar maiusculas nem espacos nas pontas
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
