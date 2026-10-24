// % e _ digitados pelo usuario sao texto, nao curingas do LIKE
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
