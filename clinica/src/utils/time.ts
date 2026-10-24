// "HH:MM" (ou "HH:MM:SS", como o Postgres devolve) em minutos desde 00:00
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Corta os segundos que a coluna time devolve: "08:00:00" vira "08:00"
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export interface MinuteRange {
  start: number;
  end: number;
}

// Intervalos semiabertos [inicio, fim): encostados, um terminando quando
// o outro comeca, nao se sobrepoem
export function rangesOverlap(a: MinuteRange, b: MinuteRange): boolean {
  return a.start < b.end && b.start < a.end;
}
