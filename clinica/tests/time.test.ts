import { formatTime, rangesOverlap, timeToMinutes } from '../src/utils/time';

describe('time', () => {
  it.each([
    ['00:00', 0],
    ['08:30', 510],
    ['23:59', 1439],
    ['08:30:00', 510],
  ])('converte %s em %i minutos', (time, minutes) => {
    expect(timeToMinutes(time)).toBe(minutes);
  });

  it('corta os segundos que o Postgres devolve', () => {
    expect(formatTime('08:00:00')).toBe('08:00');
    expect(formatTime('14:30')).toBe('14:30');
  });

  describe('rangesOverlap', () => {
    const morning = { start: 480, end: 720 };

    it.each([
      ['comeca no meio', { start: 660, end: 780 }],
      ['contem o outro', { start: 420, end: 780 }],
      ['esta contido', { start: 540, end: 600 }],
      ['e identico', { start: 480, end: 720 }],
    ])('detecta sobreposicao quando o segundo %s', (_case, other) => {
      expect(rangesOverlap(morning, other)).toBe(true);
      expect(rangesOverlap(other, morning)).toBe(true);
    });

    it.each([
      ['encostado depois', { start: 720, end: 1080 }],
      ['encostado antes', { start: 360, end: 480 }],
      ['separado', { start: 840, end: 900 }],
    ])('nao ha sobreposicao quando o segundo esta %s', (_case, other) => {
      expect(rangesOverlap(morning, other)).toBe(false);
      expect(rangesOverlap(other, morning)).toBe(false);
    });
  });
});
