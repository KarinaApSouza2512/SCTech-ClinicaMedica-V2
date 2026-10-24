import { clinicDayStart, toClinicTime } from '../src/utils/clinicTime';

describe('clinicTime', () => {
  describe('toClinicTime', () => {
    it('converte o instante UTC para dia da semana e minutos em Sao Paulo', () => {
      // 11:00Z = 08:00 local, terca-feira
      expect(toClinicTime(new Date('2026-10-13T11:00:00Z'))).toEqual({
        weekDay: 2,
        minutesOfDay: 480,
      });
    });

    it('da o mesmo resultado para o mesmo instante escrito com outro fuso', () => {
      const fromLocal = toClinicTime(new Date('2026-10-13T08:30:00-03:00'));
      const fromOther = toClinicTime(new Date('2026-10-13T13:30:00+02:00'));

      expect(fromLocal).toEqual({ weekDay: 2, minutesOfDay: 510 });
      expect(fromOther).toEqual(fromLocal);
    });

    it('usa o dia local quando o UTC ja virou o dia', () => {
      // 01:00Z de quarta = 22:00 de terca na clinica
      expect(toClinicTime(new Date('2026-10-14T01:00:00Z'))).toEqual({
        weekDay: 2,
        minutesOfDay: 22 * 60,
      });
    });

    it('representa segundos como fracao do minuto', () => {
      expect(toClinicTime(new Date('2026-10-13T11:00:30Z')).minutesOfDay).toBe(480.5);
    });

    it('trata a meia-noite local como minuto zero', () => {
      expect(toClinicTime(new Date('2026-10-13T03:00:00Z'))).toEqual({
        weekDay: 2,
        minutesOfDay: 0,
      });
    });
  });

  describe('clinicDayStart', () => {
    it('devolve o instante UTC da meia-noite local', () => {
      expect(clinicDayStart('2026-10-13').toISOString()).toBe('2026-10-13T03:00:00.000Z');
    });

    it('respeita o horario de verao quando o fuso o tinha', () => {
      // Em 2018 Sao Paulo estava em -02:00 em dezembro
      expect(clinicDayStart('2018-12-10').toISOString()).toBe('2018-12-10T02:00:00.000Z');
    });

    it('usa o primeiro instante do dia quando a meia-noite local nao existiu', () => {
      // 04/11/2018: o relogio pulou de 00:00 para 01:00 (inicio do horario de verao)
      expect(clinicDayStart('2018-11-04').toISOString()).toBe('2018-11-04T03:00:00.000Z');
    });

    it('usa a segunda meia-noite quando ela se repetiu no fim do horario de verao', () => {
      // 17/02/2019: 00:00 voltou para 23:00 do dia 16; o dia 17 comeca as 03:00Z
      expect(clinicDayStart('2019-02-17').toISOString()).toBe('2019-02-17T03:00:00.000Z');
    });

    it('volta para o mesmo dia e minuto zero quando convertido de novo', () => {
      expect(toClinicTime(clinicDayStart('2026-10-18'))).toEqual({
        weekDay: 0,
        minutesOfDay: 0,
      });
    });
  });
});
