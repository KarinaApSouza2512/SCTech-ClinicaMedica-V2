import { Patient } from '../src/entities/Patient';
import { DomainError } from '../src/errors/DomainError';
import { IPatientRepository } from '../src/repositories/ports/IPatientRepository';
import { PatientService } from '../src/services/PatientService';

function buildPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 1,
    name: 'Maria Silva',
    cpf: '12345678901',
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}

describe('PatientService', () => {
  let patientRepository: jest.Mocked<IPatientRepository>;
  let patientService: PatientService;

  beforeEach(() => {
    patientRepository = {
      findById: jest.fn(),
      findByCpf: jest.fn(),
      findPage: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    patientService = new PatientService(patientRepository);
  });

  describe('create', () => {
    it('cria o paciente com o nome sem espacos nas pontas', async () => {
      const patient = buildPatient();
      patientRepository.findByCpf.mockResolvedValue(null);
      patientRepository.create.mockResolvedValue(patient);

      const result = await patientService.create({ name: '  Maria Silva ', cpf: '12345678901' });

      expect(patientRepository.findByCpf).toHaveBeenCalledWith('12345678901');
      expect(patientRepository.create).toHaveBeenCalledWith({
        name: 'Maria Silva',
        cpf: '12345678901',
      });
      expect(result).toBe(patient);
    });

    it('lanca CPF_JA_CADASTRADO quando o cpf ja existe', async () => {
      patientRepository.findByCpf.mockResolvedValue(buildPatient());

      const result = patientService.create({ name: 'Outra', cpf: '12345678901' });

      await expect(result).rejects.toBeInstanceOf(DomainError);
      await expect(result).rejects.toMatchObject({ code: 'CPF_JA_CADASTRADO' });
      expect(patientRepository.create).not.toHaveBeenCalled();
    });

    it('tambem bloqueia o cpf de um paciente removido', async () => {
      patientRepository.findByCpf.mockResolvedValue(
        buildPatient({ deletedAt: new Date('2024-02-01') }),
      );

      await expect(
        patientService.create({ name: 'Maria', cpf: '12345678901' }),
      ).rejects.toMatchObject({ code: 'CPF_JA_CADASTRADO' });
    });
  });

  describe('list', () => {
    it('devolve a pagina com a meta calculada a partir do total', async () => {
      const patients = [buildPatient({ id: 3 }), buildPatient({ id: 4 })];
      patientRepository.findPage.mockResolvedValue([patients, 5]);

      const result = await patientService.list({ page: 2, pageSize: 2 });

      expect(patientRepository.findPage).toHaveBeenCalledWith({
        page: 2,
        pageSize: 2,
        name: undefined,
      });
      expect(result).toEqual({
        data: patients,
        meta: { total: 5, page: 2, pageSize: 2, totalPages: 3 },
      });
    });

    it('repassa o filtro de nome sem espacos nas pontas', async () => {
      patientRepository.findPage.mockResolvedValue([[], 0]);

      const result = await patientService.list({ page: 1, pageSize: 20, name: '  mar ' });

      expect(patientRepository.findPage).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        name: 'mar',
      });
      expect(result.meta).toEqual({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
    });

    it('ignora filtro de nome em branco', async () => {
      patientRepository.findPage.mockResolvedValue([[], 0]);

      await patientService.list({ page: 1, pageSize: 20, name: '   ' });

      expect(patientRepository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ name: undefined }),
      );
    });
  });

  describe('findById', () => {
    it('retorna o paciente quando ele existe', async () => {
      const patient = buildPatient();
      patientRepository.findById.mockResolvedValue(patient);

      await expect(patientService.findById(1)).resolves.toBe(patient);
      expect(patientRepository.findById).toHaveBeenCalledWith(1);
    });

    it('lanca RECURSO_NAO_ENCONTRADO quando o paciente nao existe', async () => {
      patientRepository.findById.mockResolvedValue(null);

      await expect(patientService.findById(99)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO',
      });
    });
  });

  describe('update', () => {
    it('altera somente o nome e salva', async () => {
      patientRepository.findById.mockResolvedValue(buildPatient());
      patientRepository.save.mockImplementation((patient) => Promise.resolve(patient));

      const result = await patientService.update(1, { name: ' Maria S. ' });

      expect(patientRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Maria S.', cpf: '12345678901' }),
      );
      expect(result.name).toBe('Maria S.');
    });

    it('lanca RECURSO_NAO_ENCONTRADO ao atualizar paciente inexistente', async () => {
      patientRepository.findById.mockResolvedValue(null);

      await expect(patientService.update(99, { name: 'X' })).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO',
      });
      expect(patientRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('faz a remocao logica do paciente existente', async () => {
      patientRepository.findById.mockResolvedValue(buildPatient());

      await patientService.remove(1);

      expect(patientRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('lanca RECURSO_NAO_ENCONTRADO ao remover paciente inexistente', async () => {
      patientRepository.findById.mockResolvedValue(null);

      await expect(patientService.remove(99)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO',
      });
      expect(patientRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
