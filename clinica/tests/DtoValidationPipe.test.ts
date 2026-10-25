import 'reflect-metadata';
import { ArgumentMetadata } from '@nestjs/common';
import { CalendarQueryDto } from '../src/dto/CalendarQueryDto';
import { CreateDoctorDto } from '../src/dto/CreateDoctorDto';
import { CreateMedicalRecordDto } from '../src/dto/CreateMedicalRecordDto';
import { CreateUserDto } from '../src/dto/CreateUserDto';
import { IdParamDto } from '../src/dto/IdParamDto';
import { ListAppointmentsQueryDto } from '../src/dto/ListAppointmentsQueryDto';
import { LoginDto } from '../src/dto/LoginDto';
import { WorkScheduleDto } from '../src/dto/WorkScheduleDto';
import { DomainError } from '../src/errors/DomainError';
import { DtoValidationPipe } from '../src/pipes/DtoValidationPipe';

describe('DtoValidationPipe', () => {
  const pipe = new DtoValidationPipe();
  const param: ArgumentMetadata = { type: 'param', metatype: IdParamDto };
  const body: ArgumentMetadata = { type: 'body', metatype: LoginDto };

  it('converte o parametro id para numero', async () => {
    await expect(pipe.transform({ id: '42' }, param)).resolves.toEqual({ id: 42 });
  });

  it.each(['abc', '0', '1.5'])('recusa o id %s com DADOS_INVALIDOS', async (id) => {
    const result = pipe.transform({ id }, param);

    await expect(result).rejects.toBeInstanceOf(DomainError);
    await expect(result).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
  });

  it('ignora campos que nao estao no DTO', async () => {
    const result = await pipe.transform({ email: 'ana@x.com', password: '123', doctorId: 7 }, body);

    expect(result).toEqual({ email: 'ana@x.com', password: '123' });
  });

  it('recusa corpo ausente com DADOS_INVALIDOS', async () => {
    await expect(pipe.transform(undefined, body)).rejects.toMatchObject({
      code: 'DADOS_INVALIDOS',
    });
  });

  describe('CreateUserDto', () => {
    const createUser: ArgumentMetadata = { type: 'body', metatype: CreateUserDto };
    const valid = {
      name: 'Joana',
      email: 'joana@medclinic.com',
      password: 'SenhaForte@123',
      roles: ['secretary'],
    };

    it('aceita perfis validos', async () => {
      await expect(pipe.transform(valid, createUser)).resolves.toMatchObject(valid);
    });

    it.each([[['root']], [[]], ['admin']])('recusa roles %j com DADOS_INVALIDOS', async (roles) => {
      await expect(pipe.transform({ ...valid, roles }, createUser)).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS',
      });
    });

    it('aceita nome curto e recusa nome em branco', async () => {
      await expect(pipe.transform({ ...valid, name: ' X ' }, createUser)).resolves.toMatchObject({
        name: 'X',
      });
      await expect(pipe.transform({ ...valid, name: '   ' }, createUser)).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS',
      });
    });
  });

  describe('CreateDoctorDto', () => {
    const createDoctor: ArgumentMetadata = { type: 'body', metatype: CreateDoctorDto };
    const valid = {
      name: 'Dra. Helena Souza',
      email: 'helena@medclinic.com',
      password: 'SenhaForte@123',
      crm: 'CRM-SC-54321',
    };

    it('aceita o corpo do contrato e nome curto', async () => {
      await expect(pipe.transform(valid, createDoctor)).resolves.toEqual(valid);
      await expect(pipe.transform({ ...valid, name: 'X' }, createDoctor)).resolves.toMatchObject({
        name: 'X',
      });
    });

    it.each(['name', 'email', 'password', 'crm'])('recusa corpo sem %s', async (field) => {
      const body: Record<string, string> = { ...valid };
      delete body[field];

      await expect(pipe.transform(body, createDoctor)).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS',
      });
    });
  });

  describe('WorkScheduleDto', () => {
    const schedule: ArgumentMetadata = { type: 'body', metatype: WorkScheduleDto };
    const valid = { weekDay: 2, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 };

    it('aceita a escala do contrato e a lista vazia', async () => {
      await expect(pipe.transform({ shifts: [valid] }, schedule)).resolves.toEqual({
        shifts: [valid],
      });
      await expect(pipe.transform({ shifts: [] }, schedule)).resolves.toEqual({ shifts: [] });
    });

    it.each([
      ['weekDay 7', { weekDay: 7 }],
      ['weekDay -1', { weekDay: -1 }],
      ['weekDay fracionado', { weekDay: 1.5 }],
      ['hora sem zero a esquerda', { startTime: '8:00' }],
      ['hora 24:00', { endTime: '24:00' }],
      ['minuto 60', { startTime: '08:60' }],
      ['hora com segundos', { startTime: '08:00:00' }],
      ['duracao zero', { slotDurationMinutes: 0 }],
      ['duracao negativa', { slotDurationMinutes: -30 }],
      ['duracao fracionada', { slotDurationMinutes: 1.5 }],
      ['duracao em texto', { slotDurationMinutes: '30' }],
    ])('recusa turno com %s', async (_case, change) => {
      const result = pipe.transform({ shifts: [{ ...valid, ...change }] }, schedule);

      await expect(result).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
    });

    it('recusa corpo sem a lista de turnos', async () => {
      await expect(pipe.transform({}, schedule)).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS',
      });
    });
  });

  describe('ListAppointmentsQueryDto', () => {
    const query: ArgumentMetadata = { type: 'query', metatype: ListAppointmentsQueryDto };

    it('converte os ids da query e aplica a paginacao padrao', async () => {
      await expect(
        pipe.transform({ doctorId: '3', patientId: '10', from: '2026-10-12' }, query),
      ).resolves.toEqual({ doctorId: 3, patientId: 10, from: '2026-10-12', page: 1, pageSize: 20 });
    });

    it.each([
      ['status fora do enum', { status: 'finished' }],
      ['data com barras', { from: '12/10/2026' }],
      ['data inexistente', { to: '2026-02-30' }],
      ['data com hora', { from: '2026-10-12T08:00:00Z' }],
      ['doctorId zero', { doctorId: '0' }],
    ])('recusa %s', async (_case, value) => {
      await expect(pipe.transform(value, query)).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
    });
  });

  describe('CalendarQueryDto', () => {
    const query: ArgumentMetadata = { type: 'query', metatype: CalendarQueryDto };

    it('exige from e to', async () => {
      await expect(pipe.transform({ from: '2026-10-12' }, query)).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS',
      });
      const valid = { from: '2026-10-12', to: '2026-10-16' };
      await expect(pipe.transform(valid, query)).resolves.toEqual(valid);
    });
  });

  describe('CreateMedicalRecordDto', () => {
    const medicalRecord: ArgumentMetadata = { type: 'body', metatype: CreateMedicalRecordDto };

    it('descarta doctorId e patientId do corpo, sem erro', async () => {
      const result = await pipe.transform(
        { text: '  Dor lombar.  ', doctorId: 99, patientId: 42 },
        medicalRecord,
      );

      expect(result).toEqual({ text: 'Dor lombar.' });
    });

    it.each([
      ['ausente', {}],
      ['vazio', { text: '' }],
      ['so com espacos', { text: '   ' }],
      ['que nao e texto', { text: 123 }],
    ])('recusa texto %s', async (_case, body) => {
      await expect(pipe.transform(body, medicalRecord)).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS',
      });
    });
  });
});
