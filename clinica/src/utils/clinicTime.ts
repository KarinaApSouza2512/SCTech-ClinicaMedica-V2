// Fuso da clinica (RN06); o offset vem do Intl, entao horario de verao futuro e respeitado
export const CLINIC_TIME_ZONE = 'America/Sao_Paulo';

export interface ClinicTime {
  // 0 = domingo, como Date.getDay()
  weekDay: number;
  // Minutos desde 00:00 local; segundos viram fracao, para nao alinhar com a grade
  minutesOfDay: number;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MINUTE_MS = 60_000;

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CLINIC_TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

interface LocalParts {
  weekDay: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function localParts(date: Date): LocalParts {
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    parts[part.type] = part.value;
  }

  return {
    weekDay: WEEK_DAYS.indexOf(parts.weekday),
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function toClinicTime(date: Date): ClinicTime {
  const local = localParts(date);
  const fraction = (local.second + date.getUTCMilliseconds() / 1000) / 60;

  return { weekDay: local.weekDay, minutesOfDay: local.hour * 60 + local.minute + fraction };
}

// Diferenca, em minutos, entre o relogio local e o UTC naquele instante
function offsetMinutes(date: Date): number {
  const local = localParts(date);
  const localAsUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  );

  return Math.round((localAsUtc - Math.floor(date.getTime() / 1000) * 1000) / MINUTE_MS);
}

function localDate(parts: LocalParts): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

// 'YYYY-MM-DD' local -> primeiro instante UTC daquele dia na clinica
export function clinicDayStart(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  const midnightAsUtc = Date.UTC(year, month - 1, date);
  const halfDay = 12 * 60 * MINUTE_MS;

  // Se o offset muda na virada do dia, a meia-noite pode nao existir ou se repetir:
  // testa o offset de antes e o de depois e fica com o primeiro instante do dia pedido
  const candidates = [midnightAsUtc - halfDay, midnightAsUtc + halfDay]
    .map((probe) => midnightAsUtc - offsetMinutes(new Date(probe)) * MINUTE_MS)
    .filter((instant) => localDate(localParts(new Date(instant))) === day);

  return new Date(Math.min(...candidates));
}
