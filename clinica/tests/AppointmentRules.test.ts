import { AppointmentStatus } from '../src/enums/AppointmentStatus';
import {
  findShiftForSlot,
  Period,
  periodsOverlap,
  StatusActor,
  transitionAuthority,
} from '../src/services/AppointmentRules';

function period(start: string, end: string): Period {
  return { start: new Date(`2026-10-13T${start}:00Z`), end: new Date(`2026-10-13T${end}:00Z`) };
}

describe('AppointmentRules', () => {
  describe('periodsOverlap', () => {
    // Consulta de referencia: 10:00 a 10:30
    const base = period('10:00', '10:30');

    it.each([
      ['antes, sem encostar', period('09:00', '09:30'), false],
      ['depois, sem encostar', period('11:00', '11:30'), false],
      ['encostado no fim', period('10:30', '11:00'), false],
      ['encostado no inicio', period('09:30', '10:00'), false],
      ['um dentro do outro', period('10:10', '10:20'), true],
      ['contendo o outro', period('09:00', '11:00'), true],
      ['cruzando a borda do fim', period('10:20', '10:50'), true],
      ['cruzando a borda do inicio', period('09:50', '10:10'), true],
      ['com o mesmo periodo', period('10:00', '10:30'), true],
    ])('periodo %s -> %s', (_case, other, expected) => {
      expect(periodsOverlap(base, other)).toBe(expected);
      // A relacao e simetrica
      expect(periodsOverlap(other, base)).toBe(expected);
    });
  });

  describe('findShiftForSlot', () => {
    const morning = { weekDay: 2, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 };
    const afternoon = { weekDay: 2, startTime: '14:00', endTime: '18:00', slotDurationMinutes: 20 };
    const shifts = [morning, afternoon];
    const at = (hours: number, minutes = 0) => hours * 60 + minutes;

    it('devolve o turno quando o horario e o inicio de um slot', () => {
      expect(findShiftForSlot(shifts, 2, at(8))).toBe(morning);
      expect(findShiftForSlot(shifts, 2, at(11, 30))).toBe(morning);
      expect(findShiftForSlot(shifts, 2, at(14, 40))).toBe(afternoon);
    });

    it('devolve null fora de qualquer turno ou em outro dia', () => {
      expect(findShiftForSlot(shifts, 2, at(13))).toBeNull();
      expect(findShiftForSlot(shifts, 2, at(7, 30))).toBeNull();
      expect(findShiftForSlot(shifts, 3, at(8))).toBeNull();
      expect(findShiftForSlot([], 2, at(8))).toBeNull();
    });

    it('devolve null quando o horario nao esta alinhado a grade do turno', () => {
      expect(findShiftForSlot(shifts, 2, at(8, 20))).toBeNull();
      expect(findShiftForSlot(shifts, 2, at(14, 30))).toBeNull();
      expect(findShiftForSlot(shifts, 2, at(8) + 0.5)).toBeNull();
    });

    it('devolve null quando a consulta nao cabe ate o fim do turno', () => {
      // 30 min a partir de 11:45 passaria das 12:00 (e tambem nao esta alinhado)
      expect(findShiftForSlot(shifts, 2, at(11, 45))).toBeNull();
      // Turno de 08:00 a 09:10 com slots de 30: 09:00 esta alinhado, mas nao cabe
      const short = { ...morning, endTime: '09:10' };
      expect(findShiftForSlot([short], 2, at(9))).toBeNull();
    });

    it('trata o fim do turno como exclusivo', () => {
      expect(findShiftForSlot(shifts, 2, at(12))).toBeNull();
    });
  });

  describe('transitionAuthority', () => {
    const { SCHEDULED, IN_PROGRESS, DONE, CANCELLED } = AppointmentStatus;
    const none: StatusActor = { isAdmin: false, isSecretary: false, isAppointmentDoctor: false };
    const actors: Record<string, StatusActor> = {
      admin: { ...none, isAdmin: true },
      secretary: { ...none, isSecretary: true },
      appointmentDoctor: { ...none, isAppointmentDoctor: true },
      otherDoctor: none,
    };

    // Tabela da secao 4.9.7: quem pode cada transicao permitida
    const allowed: [AppointmentStatus, AppointmentStatus, string[]][] = [
      [SCHEDULED, IN_PROGRESS, ['admin', 'appointmentDoctor']],
      [SCHEDULED, CANCELLED, ['admin', 'secretary', 'appointmentDoctor']],
      [IN_PROGRESS, DONE, ['admin', 'appointmentDoctor']],
      [IN_PROGRESS, CANCELLED, ['admin', 'appointmentDoctor']],
    ];

    it.each(allowed)('%s -> %s: so %j podem', (from, to, who) => {
      const authority = transitionAuthority(from, to);

      expect(authority).not.toBeNull();
      for (const [name, actor] of Object.entries(actors)) {
        expect([name, authority?.(actor)]).toEqual([name, who.includes(name)]);
      }
    });

    const statuses = [SCHEDULED, IN_PROGRESS, DONE, CANCELLED];
    const notAllowed = statuses
      .flatMap((from) => statuses.map((to): [AppointmentStatus, AppointmentStatus] => [from, to]))
      .filter(([from, to]) => !allowed.some(([f, t]) => f === from && t === to));

    it.each(notAllowed)('%s -> %s nao existe no ciclo de vida', (from, to) => {
      expect(transitionAuthority(from, to)).toBeNull();
    });

    it('done e cancelled sao finais', () => {
      for (const to of statuses) {
        expect(transitionAuthority(DONE, to)).toBeNull();
        expect(transitionAuthority(CANCELLED, to)).toBeNull();
      }
    });
  });
});
