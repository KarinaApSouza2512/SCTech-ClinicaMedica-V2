import { WorkShift } from '../src/entities/WorkShift';
import { DomainError } from '../src/errors/DomainError';
import {
  IWorkScheduleRepository,
  ShiftData,
} from '../src/repositories/ports/IWorkScheduleRepository';
import { DoctorService } from '../src/services/DoctorService';
import { WorkScheduleService } from '../src/services/WorkScheduleService';

// Factory evita carregar o modulo real, que le o config/env (importado pelo DoctorService)
jest.mock('../src/utils/hash', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

function shift(weekDay: number, startTime: string, endTime: string, slot = 30): ShiftData {
  return { weekDay, startTime, endTime, slotDurationMinutes: slot };
}

function saved(doctorId: number, data: ShiftData, id = 1): WorkShift {
  return { id, doctorId, ...data } as WorkShift;
}

describe('WorkScheduleService', () => {
  let workScheduleRepository: jest.Mocked<IWorkScheduleRepository>;
  let doctorService: jest.Mocked<DoctorService>;
  let workScheduleService: WorkScheduleService;

  beforeEach(() => {
    workScheduleRepository = {
      findByDoctorId: jest.fn(),
      replaceForDoctor: jest.fn(),
    };
    doctorService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<DoctorService>;

    workScheduleService = new WorkScheduleService(workScheduleRepository, doctorService);
  });

  describe('replace', () => {
    it('substitui a escala inteira do medico pelos turnos enviados', async () => {
      const shifts = [shift(2, '08:00', '12:00'), shift(4, '14:00', '18:00', 20)];
      const result = shifts.map((data, index) => saved(3, data, index + 1));
      workScheduleRepository.replaceForDoctor.mockResolvedValue(result);

      await expect(workScheduleService.replace(3, shifts)).resolves.toBe(result);

      expect(doctorService.findById).toHaveBeenCalledWith(3);
      expect(workScheduleRepository.replaceForDoctor).toHaveBeenCalledWith(3, shifts);
    });

    it('aceita lista vazia, que apaga a escala', async () => {
      workScheduleRepository.replaceForDoctor.mockResolvedValue([]);

      await expect(workScheduleService.replace(3, [])).resolves.toEqual([]);
      expect(workScheduleRepository.replaceForDoctor).toHaveBeenCalledWith(3, []);
    });

    it('rejeita turno com startTime maior ou igual a endTime', async () => {
      for (const invalid of [shift(1, '12:00', '08:00'), shift(1, '08:00', '08:00')]) {
        const result = workScheduleService.replace(3, [invalid]);

        await expect(result).rejects.toBeInstanceOf(DomainError);
        await expect(result).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
      }
      expect(workScheduleRepository.replaceForDoctor).not.toHaveBeenCalled();
    });

    it('rejeita dois turnos sobrepostos no mesmo dia', async () => {
      const result = workScheduleService.replace(3, [
        shift(2, '08:00', '12:00'),
        shift(2, '11:00', '13:00'),
      ]);

      await expect(result).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
      expect(workScheduleRepository.replaceForDoctor).not.toHaveBeenCalled();
    });

    it('aceita turnos encostados no mesmo dia', async () => {
      const shifts = [shift(2, '08:00', '12:00'), shift(2, '12:00', '18:00')];
      workScheduleRepository.replaceForDoctor.mockResolvedValue([]);

      await workScheduleService.replace(3, shifts);

      expect(workScheduleRepository.replaceForDoctor).toHaveBeenCalledWith(3, shifts);
    });

    it('aceita o mesmo horario em dias diferentes', async () => {
      const shifts = [shift(2, '08:00', '12:00'), shift(4, '08:00', '12:00')];
      workScheduleRepository.replaceForDoctor.mockResolvedValue([]);

      await workScheduleService.replace(3, shifts);

      expect(workScheduleRepository.replaceForDoctor).toHaveBeenCalledWith(3, shifts);
    });

    it('detecta sobreposicao mesmo com os turnos fora de ordem', async () => {
      const result = workScheduleService.replace(3, [
        shift(3, '14:00', '15:00'),
        shift(1, '08:00', '12:00'),
        shift(3, '08:00', '18:00'),
      ]);

      await expect(result).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS',
        message: 'Turnos sobrepostos no dia 3: 08:00-18:00 e 14:00-15:00',
      });
    });

    it('rejeita dois turnos identicos no mesmo dia', async () => {
      await expect(
        workScheduleService.replace(3, [shift(2, '08:00', '12:00'), shift(2, '08:00', '12:00')]),
      ).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
    });

    it('aceita manha e tarde com duracoes de consulta diferentes', async () => {
      const shifts = [shift(2, '14:00', '18:00', 20), shift(2, '08:00', '12:00', 30)];
      workScheduleRepository.replaceForDoctor.mockResolvedValue([]);

      await workScheduleService.replace(3, shifts);

      // O service valida, mas grava os turnos como vieram
      expect(workScheduleRepository.replaceForDoctor).toHaveBeenCalledWith(3, shifts);
    });

    it('valida os dados antes de consultar o medico', async () => {
      await expect(
        workScheduleService.replace(3, [shift(1, '10:00', '09:00')]),
      ).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
      expect(doctorService.findById).not.toHaveBeenCalled();
    });

    it('propaga o 404 quando o medico nao existe e nao grava nada', async () => {
      doctorService.findById.mockRejectedValue(
        new DomainError('RECURSO_NAO_ENCONTRADO', 'Medico nao encontrado'),
      );

      await expect(
        workScheduleService.replace(99, [shift(1, '08:00', '12:00')]),
      ).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
      expect(workScheduleRepository.replaceForDoctor).not.toHaveBeenCalled();
    });
  });

  describe('findByDoctorId', () => {
    it('devolve lista vazia para medico sem escala', async () => {
      workScheduleRepository.findByDoctorId.mockResolvedValue([]);

      await expect(workScheduleService.findByDoctorId(3)).resolves.toEqual([]);
      expect(doctorService.findById).toHaveBeenCalledWith(3);
    });

    it('propaga o 404 quando o medico nao existe', async () => {
      doctorService.findById.mockRejectedValue(
        new DomainError('RECURSO_NAO_ENCONTRADO', 'Medico nao encontrado'),
      );

      await expect(workScheduleService.findByDoctorId(99)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO',
      });
      expect(workScheduleRepository.findByDoctorId).not.toHaveBeenCalled();
    });
  });
});
